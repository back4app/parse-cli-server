import crypto from 'crypto';
import path from 'path';

const DeployInfoBasePath = "_deployInfo";
const DeployInfoCollectionName = "deployInfo";
const FilesCollectionName = "deployFile";

function computeChecksum(content){
    var algo = 'md5',
        md5sum = crypto.createHash(algo);
    md5sum.update(content);
    return md5sum.digest('hex');
}

class ParseCliController {
  constructor(config: any, vendorAdapter: any){
    this.config = config || {};
    this.vendorAdapter = vendorAdapter;
  }

  isSupported(mode, other, version){
    return new Promise((resolve, reject) => {
      // local commands must be defined
      var localCommands = [
        "default",
        "generate",
        "-h",
        "--help",
        "help",
        "migrate",
        "update",
        "version",
      ],
      commands = [
        "configure accountkey",
        "new",
        "deploy",
        "develop",
        "download",
      ],
      nokCommands = [
        "add",
        "functions",
        "jssdk",
        "list",
        "logs",
        "releases",
        "rollback",
        "symbols",
        "triggers",
      ],
      tokens = {};
      localCommands.forEach(value => {
        tokens[value] = true;
      });
      commands.forEach(value => {
        tokens[value] = true;
      });

      if (mode == 'parse') {
        var parts = other.split(" ");
        for (var i = 1; i <= parts.length; i++) {
          var token = parts.slice(0, i).join(" ");
          if (tokens[token]) {
            resolve({});
            return;
          }
        }
      }
      reject();
    });
  }

  getEmail(accountKey){
    // return a promise with the email as result
    return this.vendorAdapter.getEmail(accountKey);
  }

  getJsVersions(){
    return this.vendorAdapter.getJsVersions();
  }

  getApps() {
    return this.vendorAdapter.getApps();
  }

  getApp(applicationId) {
    return this.vendorAdapter.getApp(applicationId);
  }

  createApp(appName) {
    return this.vendorAdapter.createApp(appName);
  }

  getFile(folder, filename, version, checksum){
    return this.config.databaseController.find(FilesCollectionName, {
      folder: folder,
      filename: filename,
      version: version,
      checksum: checksum
    })
    .then(objects => {
      var object = objects[0];
      return this.config.filesController.getFileData(this.config, object.name);
    });
  }

  uploadFile(folder, filename, content){
    var key = path.join(folder, filename)
    var checksum = computeChecksum(content);

    return this.config.databaseController.find(
      FilesCollectionName, {
        folder: folder,
        filename: filename
      }, {
        sort: {createdAt: 1}
      })
    .then(objects => {
      var nextVersion;

      if (objects.length == 0) {
        nextVersion = 1;
      }
      else {
        var object = objects[0],
            currentVersion = object.version;
        nextVersion = parseInt(currentVersion) + 1;
      }
      return nextVersion.toString();
    })
    .then(version => this.config.filesController.createFile(
        this.config,
        path.join(DeployInfoBasePath, key),
        content)
      .then(obj => this.config.databaseController.create(FilesCollectionName, {
          version: version,
          checksum: checksum,
          folder: folder,
          filename: filename,
          name: obj.name,
          url: obj.url
        })
      )
      .then(() => version)
    );
  }

  getDeployInfo(){
    return this.config.databaseController.find(DeployInfoCollectionName, {}, {
      sort: {createdAt: 1},
      limit: 1
    })
    .then(results => {
      return results.map(deployInfo => {
        return this._unpatchDeployInfo(deployInfo);
      });
    })
    .then(results => {
      return results.length !== 0 ? results[0] : null;
    });
  }

  setDeployInfo(deployInfo){
    return this.config.databaseController.create(
      DeployInfoCollectionName,
      this._patchDeployInfo(deployInfo));
  }

  // Patch deployInfo to avoid keys invalid chars, like dots in filenames.
  _patchDeployInfo(deployInfo){
    deployInfo.files = [];
    Object.keys(deployInfo.userFiles).forEach(folder => {
      Object.keys(deployInfo.userFiles[folder]).forEach(filename => {
        var version = deployInfo.userFiles[folder][filename],
          checksum = deployInfo.checksums[folder][filename];
        deployInfo.files.push({
          folder: folder,
          filename: filename,
          version: version,
          checksum: checksum
        });
      });
    });
    delete deployInfo.userFiles;
    delete deployInfo.checksums;
    return deployInfo;
  }

  _unpatchDeployInfo(deployInfo){
    deployInfo.userFiles = {};
    deployInfo.checksums = {};

    deployInfo.files.forEach(obj => {
      deployInfo.userFiles[obj.folder] = deployInfo.userFiles[obj.folder] || {};
      deployInfo.userFiles[obj.folder][obj.filename] = obj.version;

      deployInfo.checksums[obj.folder] = deployInfo.checksums[obj.folder] || {};
      deployInfo.checksums[obj.folder][obj.filename] = obj.checksum;
    });
    delete deployInfo.files;
    return deployInfo;
  }

  _collect(deployInfo, folder){
    var promises = Object.keys(deployInfo.userFiles[folder])
    .map(filename => {
      var version = deployInfo.userFiles[folder][filename],
        checksum = deployInfo.checksums[folder][filename];
      return this.getFile(folder, filename, version, checksum)
      .then(data => {
        return this.vendorAdapter.collect(path.join(folder, filename), data);
      });
    });
    return Promise.all(promises);
  }

  deploy(deployInfo){
    return this._collect(deployInfo, 'cloud')
    .then(() => this._collect(deployInfo, 'public'))
    .then(() => this.setDeployInfo(deployInfo))
    .then(() => this.vendorAdapter.publish())
    .then(() => deployInfo);
  }
}

export default ParseCliController;
export {
    ParseCliController
};
