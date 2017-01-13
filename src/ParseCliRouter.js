import * as middlewares from "parse-server/lib/middlewares";
import PromiseRouter from 'parse-server/lib/PromiseRouter';

let promiseHandleParseHeaders = req => {
  return new Promise((resolve, reject) => {
    let error = new Error();
    let resStub = {
      status: statusCode => {
        error.status = statusCode;
      },
      end: message => {
        error.message = JSON.parse(message).error;
      }
    };
    let next = () => {
      resolve();
    }
    let response = middlewares.handleParseHeaders(req, resStub, next);
    if (error.status) {
      throw error;
    }
    return response;
  });
};

class ParseCliRouter extends PromiseRouter {
  constructor(controller: any){
    super();
    this.controller = controller;
  }

  promiseEnforceAccountKeyAccess(req) {
    return new Promise((resolve, reject) => {
      let accountKey = req.get('X-Parse-Account-Key');
      if (accountKey) {
        return resolve(accountKey);
      }
      else {
        let email = req.get('X-Parse-Email');
        let password = req.get('X-Parse-Password');
        return this.controller.getAccountKey(email, password)
        .then(accountKey => {
          if (accountKey) {
            return resolve(accountKey);
          } else {
            return reject("invalid email and password");
          }
        });
      }
    }).then(accountKey => {
      if (!req.config) {
        req.config = {};
      }
      req.config.accountKey = accountKey;
    }).catch(error => {
      let errorObj = new Error();
      if (error === 'invalid email and password') {
        errorObj.status = 401;
      } else {
        errorObj.status = 400;
      }
      errorObj.message = error;

      throw errorObj;
    });
  }

  /*
  Before execute any command, parse-cli check with the server
  if it is supported.

  Arguments are passed by query string.

  mode="parse"
  other=<command arguments>
  version=<parse-cli version>
  */
  isSupported(req) {
    var mode = req.query.mode,
        other = req.query.other,
        version = req.query.version;

    return this.controller.isSupported(mode, other, version)
    .then(({ warning }) => {
      var obj = {};
      if (warning) {
        obj.warning = warning;
      }
      return {
        response: obj
      };
    }, () => {
      var error = {'error': 'unsupported method: ' + other};
      return {
        status: 400,
        response: error
      };
    });
  }

  configureAccountKey(req) {
    var accountKey = req.body.accountKey;

    return this.controller.getEmail(accountKey).then((email) => {
      return {
        response: {email: email}
      };
    }, () => {
      return {
        status: 400,
        response: {
          error: 'accountKey not found: ' + accountKey
        }
      };
    });
  }

  getJsVersions(req){
    return this.controller.getJsVersions(req.config.applicationId).then(versions => {
      return {
        response: {
          js: versions
        }
      };
    });
  }

  getApps(req) {
    return this.controller.getApps(req.config.accountKey)
    .then(parseApps => {
      return {
        response: {
          results: parseApps
        }
      };
    });
  }

  getApp(req){
    var applicationId = req.params.applicationId;
    return this.controller.getApp(req.config.accountKey, applicationId)
    .then(parseApp => {
      return {
        response: parseApp
      };
    });
  }

  createApp(req){
    var appName = req.body.appName;
    return this.controller.createApp(req.config.accountKey, appName)
    .then(parseApp => {
      return {response: parseApp};
    });
  }

  /*
  uploadFile body example:

  {
    "name" : "index.html",
    "content": <base64 file content>
  }
  */
  uploadFile(req, folder){
    var decode = content => new Buffer(content, 'base64').toString('ascii');
    var filename = req.body.name, content = '';
    if (req.body.content != null) {
        content = decode(req.body.content);
    }

    return this.controller.uploadFile(
        req.config.applicationId,
        folder, filename, content)
        .then(obj => {
          return {
            response: {
              version: obj.version
            }
          };
        });
  }

  getFile(req, folder, options){
    var options = options || {},
      filename = req.params.filename,
      version = req.query.version,
      checksum = req.query.checksum;
    return this.controller.getFile(
      req.config.applicationId,
      folder, filename, version, checksum)
    .then(data => {
      if (options.base64) {
        data = data.toString("base64")
      }
      else {
        data = data.toString()
      }
      return {
        response: data
      };
    });
  }

  getDeployInfo(req) {
    return this.controller.getDeployInfo(req.config.applicationId)
    .then(deployInfo => {
      deployInfo = deployInfo || {};
      return {
        response: deployInfo
      };
    });
  }

  /*
  Deploy body example:

  {
    "parseVersion" : "1.9.2",
    "checksums": {
      "cloud": {
        "main.js": "0e50654c95071583dcf707dda75ee6cc"
      },
      "public": {
        "index.js": "a9d71ca772c4fb43973b93322f3c39a5"
      }
    },
    "userFiles": {
      "cloud": {
        "main.js": "1"
      },
      "public": {
        "index.js": "2"
      }
    }
  }
  */
  deploy(req) {
    return this.controller.deploy(req.config.applicationId, req.body)
    .then(deployInfo => {
      return {
        response: deployInfo
      }
    });
  }

  getReleases(req) {
    return this.controller.getReleases(req.config.applicationId)
    .then(releases => {
      return {
        response: releases
      }
    });
  }

  symbolFiles(req) {
    // TODO: understand what this command should do
    throw new Error("symbols upload is not implemented.");
  }

  mountRoutes() {
    this.route(
      'GET',
      '/supported',
      req => this.isSupported(req));
    this.route(
      'POST',
      '/accountKey',
      req => this.configureAccountKey(req));
    this.route(
      'GET',
      '/jsVersions',
      promiseHandleParseHeaders,
      middlewares.promiseEnforceMasterKeyAccess,
      req => this.getJsVersions(req));

    // TODO: validate Parse-Account-Key
    this.route(
      'GET',
      '/apps',
      req => this.promiseEnforceAccountKeyAccess(req),
      req => this.getApps(req));
    this.route(
      'GET',
      '/apps/:applicationId',
      req => this.promiseEnforceAccountKeyAccess(req),
      req => this.getApp(req));
    this.route(
      'POST',
      '/apps',
      req => this.promiseEnforceAccountKeyAccess(req),
      req => this.createApp(req));

    this.route(
      'POST',
      '/scripts',
      promiseHandleParseHeaders,
      middlewares.promiseEnforceMasterKeyAccess,
      req => this.uploadFile(req, 'cloud'));
    this.route(
      'GET',
      '/scripts/:filename',
      promiseHandleParseHeaders,
      middlewares.promiseEnforceMasterKeyAccess,
      req => this.getFile(req, 'cloud'));
    this.route(
      'POST',
      '/hosted_files',
      promiseHandleParseHeaders,
      middlewares.promiseEnforceMasterKeyAccess,
      req => this.uploadFile(req, 'public'));
    this.route(
      'GET',
      '/hosted_files/:filename',
      promiseHandleParseHeaders,
      middlewares.promiseEnforceMasterKeyAccess,
      // public folder must be base64 encoded
      req => this.getFile(req, 'public', {base64: true}));

    this.route(
      'GET',
      '/deploy',
      promiseHandleParseHeaders,
      middlewares.promiseEnforceMasterKeyAccess,
      req => this.getDeployInfo(req));
    this.route(
      'POST',
      '/deploy',
      promiseHandleParseHeaders,
      middlewares.promiseEnforceMasterKeyAccess,
      req => this.deploy(req));

    this.route(
      'GET',
      '/releases',
      promiseHandleParseHeaders,
      middlewares.promiseEnforceMasterKeyAccess,
      req => this.getReleases(req));

    this.route(
      'POST',
      '/symbolFiles/:name',
      req => this.symbolFiles(req));
  }
}

export default ParseCliRouter;
export {
    ParseCliRouter
};
