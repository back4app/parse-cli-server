import chokidar from 'chokidar';
import fs from 'fs-extra';
import path from 'path';

import VendorAdapter from './VendorAdapter'

class LocalVendorAdapter extends VendorAdapter {
  constructor({
    config,
    appPath,
    cloud
  }) {
    super({
      config,
      cloud,
    });
    this.appPath = appPath;
    this._watchCloudCode();
  }

  _watchCloudCode(){
    var that = this,
        watcher = chokidar.watch(this.appPath)
          .on('ready', () => {
            watcher.on('all', () => {
              that._reloadCloudCode();
            });
          });
    this._reloadCloudCode();
  }

  collect(){
    return new Promise((resolve, reject) => {
      reject("LocalVendorAdapter do not accept collect method.");
    });
  }

  publish(){
    return new Promise((resolve, reject) => {
      reject("LocalVendorAdapter do not accept publish method.");
    });
  }
}

export default LocalVendorAdapter;
export { LocalVendorAdapter };
