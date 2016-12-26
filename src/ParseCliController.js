import crypto from 'crypto';
import path from 'path';

import AppCache from 'parse-server/lib/cache';

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
  constructor(vendorAdapter: any){
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
        "add",
        "configure accountkey",
        "deploy",
        "develop",
        "download",
        "functions",
        "jssdk",
        "list",
        "logs",
        "new",
        "releases",
        "triggers",
      ],
      nokCommands = [
        "rollback",
        "symbols",
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

  getAccountKey(email, password){
    return this.vendorAdapter.getAccountKey(email, password);
  }
  getEmail(accountKey){
    return this.vendorAdapter.getEmail(accountKey);
  }

  getJsVersions(appId){
    return this.vendorAdapter.getJsVersions(appId);
  }

  getApps(accountKey) {
    return this.vendorAdapter.getApps(accountKey);
  }

  getApp(accountKey, appId) {
    return this.vendorAdapter.getApp(accountKey, appId);
  }

  createApp(accountKey, appName) {
    return this.vendorAdapter.createApp(accountKey, appName);
  }

  getFile(appId, folder, filename, version, checksum){
    let config = AppCache.get(appId);
    return config.databaseController.find(
      this.getCollectionName(appId, FilesCollectionName),
      {
        folder: folder,
        filename: filename,
        version: version,
        checksum: checksum
      })
    .then(objects => {
      var object = objects[0];
        if (object != undefined) {
            return config.filesController.getFileData(config, object.name);
        } else {
            return null; // This fix the problem of empty file upload.
        }
    });
  }

  uploadFile(appId, folder, filename, content){
    let config = AppCache.get(appId),
        key = path.join(folder, filename),
        checksum = computeChecksum(content),
        filesCollectionName = this.getCollectionName(appId, FilesCollectionName);
    return config.databaseController.find(filesCollectionName, {
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
    .then(version => config.filesController.createFile(
        config,
        path.join(this.getBasePath(appId, DeployInfoBasePath), key),
        content)
      .then(obj => config.databaseController.create(filesCollectionName, {
        version: version,
        checksum: checksum,
        folder: folder,
        filename: filename,
        name: obj.name,
        url: obj.url
      }))
      .then(() => {
        return {
          checksum: checksum,
          version: version
        };
      })
    );
  }

  getDeployInfo(appId){
    let config = AppCache.get(appId);
    return config.databaseController.find(
      this.getCollectionName(appId, DeployInfoCollectionName), {}, {
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

  setDeployInfo(appId, deployInfo){
    let config = AppCache.get(appId);
    return config.databaseController.create(
      this.getCollectionName(appId, DeployInfoCollectionName),
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

  _collect(appId, deployInfo, folder){
    var promises = Object.keys(deployInfo.userFiles[folder])
    .map(filename => {
      var version = deployInfo.userFiles[folder][filename],
        checksum = deployInfo.checksums[folder][filename];
      return this.getFile(appId, folder, filename, version, checksum)
      .then(data => {
        return this.vendorAdapter.collect(
          appId, deployInfo, folder, filename, data);
      });
    });
    return Promise.all(promises);
  }

  deploy(appId, deployInfo){
    return this._processFiles(appId, deployInfo)
    .then(deployInfo => {
      deployInfo._checksum = computeChecksum(JSON.stringify(deployInfo));
      return deployInfo;
    })
    .then(deployInfo => {
      return this.getDeployInfo(appId)
      .then(currentDeployInfo => {
        var currentDeployInfoId = currentDeployInfo ? currentDeployInfo.releaseId : 0;
        var deployInfoId = currentDeployInfoId + 1;
        deployInfo.releaseId = deployInfoId;
        deployInfo.releaseName = "v" + deployInfoId;
        return this._collect(appId, deployInfo, 'cloud')
        .then(() => this._collect(appId, deployInfo, 'public'))
        .then(() => this.vendorAdapter.publish(appId, deployInfo))
        .then(() => { delete deployInfo._checksum; })
        .then(() => this.setDeployInfo(appId, deployInfo))
        .then(() => deployInfo);
      });
    });
  }

  _processFiles(appId, deployInfo){
    if (!deployInfo.files){
      return Promise.resolve(deployInfo);
    }
    if (deployInfo.checksums || deployInfo.userFiles) {
      throw new Error("Files must not be defined with checksums and userFiles.");
    }
    var promises = Object.keys(deployInfo.files)
    .map(folder => {
      var folderPromises = Object.keys(deployInfo.files[folder])
      .map(filename => {
        let content = deployInfo.files[folder][filename];
        return this.uploadFile(appId, folder, filename, content)
        .then(obj => {
          deployInfo.checksums[folder] = deployInfo.checksums[folder] || {};
          deployInfo.checksums[folder][filename] = obj.checksum;
          deployInfo.userFiles[folder] = deployInfo.userFiles[folder] || {};
          deployInfo.userFiles[folder][filename] = obj.version;
        });
      });
      return Promise.all(folderPromises);
    });
    return Promise.all(promises).then(() => {
      delete deployInfo.files;
      return deployInfo;
    });
  }

  getCollectionName(appId, collectionName) {
    return this.vendorAdapter.getCollectionName ?
      this.vendorAdapter.getCollectionName(appId, collectionName) :
      collectionName;
  }

  getBasePath(appId, basePath) {
    return this.vendorAdapter.getBasePath ?
      this.vendorAdapter.getBasePath(appId, basePath) :
      basePath;
  }

  getReleases(appId) {
    let config = AppCache.get(appId);
    return config.databaseController.find(
      this.getCollectionName(appId, DeployInfoCollectionName), {}, {
      sort: {createdAt: 1}
    })
    .then(results => {
      return results.map(deployInfo => {
        return this._unpatchDeployInfo(deployInfo);
      });
    })
    .then(results => {
      return results.map(deployInfo => {
        return {
          version: deployInfo.releaseName,
          description: deployInfo.description,
          timestamp: deployInfo.createdAt,
          // parse-cli expects a string for no reason
          userFiles: JSON.stringify(deployInfo.userFiles),
        };
      });
    });
  }
}

export default ParseCliController;
export {
    ParseCliController
};
