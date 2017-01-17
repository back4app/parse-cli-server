import fs from 'fs-extra';
import http from 'http';
import os from 'os';
import path from 'path';

import { version } from 'parse-server/package.json'

class VendorAdapter {
  constructor({
    config,
    cloud,
    public_html
  }) {
    this.config = config;
    this.cloud = cloud;
    this.public_html = public_html;
    this.cli_repository = 'ParsePlatform/parse-cli';
  }

  getCliLatestVersion() {
    return new Promise((resolve, reject) => {
      var options = {
        protocol: 'https',
        host: 'api.github.com',
        path: 'repos/' + this.cli_repository + '/releases',
      };
      var callback = response => {
        var str = '';
        response.on('data', chunk => {
          str += chunk;
        });
        response.on('end', () => {
          var releases = JSON.parse(str),
              latest = releases[0];
          resolve(latest.tag_name.slice(8));
        });
      };
      http.request(options, callback).end();
    });
  }

  getAccountKey(email, password) {
    return Promise.resolve(
      password == this.config.masterKey ? 'ACCOUNT_KEY_' + email : null);
  }

  getEmail(accountKey) {
    return new Promise((resolve, reject) => {
      if (accountKey == this.config.masterKey) {
        let email = this.config.appName + "@example.com";
        resolve(email);
      }
      else {
        reject("not found");
      }
    });
  }

  getJsVersions(appId) {
    return new Promise((resolve, reject) => {
      resolve([version]);
    });
  }

  getApps(accountKey){
    return this.getApp(accountKey, this.config.appId)
    .then(parseApp => [parseApp]);
  }

  getApp(accountKey, appId){
    return new Promise((resolve, reject) => {
      resolve({
        appName: this.config.appName,
        dashboardURL: null,  // TODO
        applicationId: appId,
        clientKey: this.config.clientKey,
        javascriptKey: this.config.javascriptKey,
        windowsKey: this.config.dotNetKey,
        webhookKey: this.config.webhookKey,
        restKey: this.config.restAPIKey,
        masterKey: this.config.masterKey,
        clientPushEnabled: false,  // TODO
        clientClassCreationEnabled: this.config.allowClientClassCreation,
        requireRevocableSessions: false,  // TODO
        revokeSessionOnPasswordChange: this.config.revokeSessionOnPasswordReset
      });
    });
  }

  createApp(accountKey, appName){
    return new Promise((resolve, reject) => {
      reject("Create app is not implemented. Parse Server does not support multiple apps.");
    });
  }

  collect(appId, deployInfo, folder, filename, data){
    var deployPath = path.join(
      os.tmpdir(),
      'parse-cli-server',
      deployInfo.releaseName,
      folder
    );
    return fs.ensureDir(deployPath, err =>{
      if (err) {
        throw err;
      }
      var filePath = path.join(deployPath, filename);
      return fs.outputFile(filePath, data, err => {
        if(err) {
          return console.log(err);
        }
      });
    });
  }

  _copy(from, to){
    return new Promise((resolve, reject) => {
      if (!to) {
        resolve();
        return;
      }

      fs.walk(from)
        .on('data', (item) => {
          if (item.path !== from) {
            let toFile = path.join(to, item.path.split(from)[1]);
            if (!item.stats.isDirectory()) {
              fs.createFile(toFile, err => {
                if (err) {
                  throw err;
                }
                fs.copy(
                  item.path,
                  toFile,
                  {clobber: true},
                  err => {
                    if (err) {
                      throw err;
                    }
                  });
              })
            } else {
              fs.ensureDir(toFile, err => {
                if (err) throw err;
              });
            }
          }
        })
        .on('end', () => {
          resolve();
        });
    });
  }

  publish(appId, deployInfo){
    var deployPath = path.join(
      os.tmpdir(),
      'parse-cli-server',
      deployInfo.releaseName
    );
    return this._copy(
      path.join(deployPath, 'cloud'),
      path.dirname(this.cloud))
    .then(
      this._copy(
        path.join(deployPath, 'public'),
        this.public_html))
    .then(() => {
      console.log("Published!")
    });
  }

  // optional collectionName customization
  getCollectionName(appId, collectionName){
    return collectionName;
  }

  // optional basePath customization
  getBasePath(appId, basePath){
    return basePath;
  }
}

export default VendorAdapter;
export { VendorAdapter };
