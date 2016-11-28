import * as fs from 'fs';
import * as os from 'os';

class VendorAdapter {
  constructor(config, cloud) {
    this.config = config;
    this.cloud = cloud;
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
    return this.getApp(this.config.applicationId)
    .then(parseApp => [parseApp]);
  }

  getApp(applicationId){
    return new Promise((resolve, reject) => {
      return {
        appName: this.config.appName,
        dashboardURL: null,  // TODO
        applicationId: this.config.applicationId,
        clientKey: this.config.clientKey,
        javascriptKey: this.config.javascriptKey,
        windowsKey: this.config.dotNetKey,
        webhookKey: this.config.webhookKey,
        restKey: this.config.restAPIKey,
        masterKey: this.config.masterKey,
        clientPushEnabled: false,  // TODO
        clientClassCreationEnabled: allowClientClassCreation,
        requireRevocableSessions: false,  // TODO
        revokeSessionOnPasswordChange: this.config.revokeSessionOnPasswordReset
      }
    });;
  }

  createApp(appName){
    throw "Create new is not supported."
    // create app and return a promise with it
  }

  collect(deployInfoId, filename, data){
    var saveTo = path.join(
      os.tmpdir(),
      deployInfoId,
      filename
    );
    fs.mkdtemp(deployInfoId, (err, folder) =>{
      if (err) {
        throw err;
      }
      fs.writeFile(saveTo, data, err => {
        if(err) {
            return console.log(err);
        }
      });
    });
  }

  publish(deployInfoId){
    return new Promise((resolve, reject) => {
      console.log("publish!");
      resolve();
    });
  }
}

export default VendorAdapter;
export { VendorAdapter };
