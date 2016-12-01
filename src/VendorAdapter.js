import fs from 'fs.extra';
import path from 'path';
import os from 'os';

class VendorAdapter {
  constructor(config, {
    cloud,
    public_html
  }) {
    this.config = config;
    this.cloud = cloud;
    this.public_html = public_html;
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

  getJsVersions() {
    return new Promise((resolve, reject) => {
      resolve(["1.9.2"]);
    });
  }

  getApps(){
    return this.getApp()
    .then(parseApp => [parseApp]);
  }

  getApp(applicationId){
    return new Promise((resolve, reject) => {
      resolve({
        appName: this.config.appName,
        dashboardURL: null,  // TODO
        applicationId: this.config.appId,
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

  createApp(appName){
    return new Promise((resolve, reject) => {
      reject("Create app is not implemented. Parse Server does not support multiple apps.");
    });
  }

  collect(deployInfo, folder, filename, data){
    var deployPath = path.join(
      os.tmpdir(),
      'parse-cli-server',
      deployInfo.releaseName,
      folder
    );
    fs.mkdirp(deployPath, err =>{
      if (err) {
        throw err;
      }
      var filePath = path.join(deployPath, filename);
      fs.writeFile(filePath, data, err => {
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
      .on('file', (root, stat, next) => {
        fs.copy(
          path.join(root, stat.name),
          path.join(to, stat.name),
          {replace: true},
          err => {
            if (err) {
              throw err;
            }
            next();
          });
      })
      .on('end', () => {
        resolve();
      });
    });
  }

  publish(deployInfo){
    var deployPath = path.join(
      os.tmpdir(),
      'parse-cli-server',
      deployInfo.releaseName
    );
    this._copy(
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
}

export default VendorAdapter;
export { VendorAdapter };
