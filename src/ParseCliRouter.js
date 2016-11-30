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

  getJsVersions(){
    return this.controller.getJsVersions().then(versions => {
      return {
        response: {
          js: versions
        }
      };
    });
  }

  getApps(req) {
    return this.controller.getApps()
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
    return this.controller.getApp(applicationId)
    .then(parseApp => {
      return {
        response: parseApp
      };
    });
  }

  createApp(req){
    var appName = req.body.appName;
    return this.controller.createApp(appName)
    .then(parseApp => {
      return {response: parseApp};
    });
  }

  uploadFile(req, folder){
    var decode = content => new Buffer(content, 'base64').toString('ascii'),
      filename = req.body.name,
      content = decode(req.body.content);

    return this.controller.uploadFile(folder, filename, content)
    .then(version => {
      return {
        response: {
          version: version
        }
      };
    });
  }

  getFile(req, folder, options){
    var options = options || {},
      filename = req.params.filename,
      version = req.query.version,
      checksum = req.query.checksum;
    return this.controller.getFile(folder, filename, version, checksum)
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
    return this.controller.getDeployInfo()
    .then(deployInfo => {
      deployInfo = deployInfo || {};
      return {
        response: deployInfo
      };
    });
  }

  deploy(req) {
    return this.controller.deploy(req.body)
    .then(deployInfo => {
      return {
        response: deployInfo
      }
    });
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
      req => this.getApps(req));
    this.route(
      'GET',
      '/apps/:applicationId',
      req => this.getApp(req));
    this.route(
      'POST',
      '/apps',
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
  }
}

export default ParseCliRouter;
export {
    ParseCliRouter
};
