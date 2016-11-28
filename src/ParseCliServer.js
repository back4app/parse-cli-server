import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

import AppCache from 'parse-server/lib/cache';

import ParseCliController from './ParseCliController';
import ParseCliRouter from './ParseCliRouter';
import VendorAdapter from './VendorAdapter';

class ParseCliServer {
  constructor(config: any, vendorAdapter: any, options){
    /*
    FIXME: not sure if it is necessary or I'm doing something wrong in my
    dev environment. AppCache here is different than parse-server AppCache.
    */
    if (config.appId) {
      AppCache.put(config.appId, config);
    }

    if (!vendorAdapter) {
      vendorAdapter = new VendorAdapter(config, options.cloud);
    }

    let controller = new ParseCliController(config, vendorAdapter);
    this.router = new ParseCliRouter(controller);
  }

  get app() {
    var app = express();

    /*
    parse-cli always send json body but don't send a Content-Type
    header or in some cases send an unexpected value like
    application/octet-stream.
    */
    app.use(bodyParser.json({type: function() { return true; }}));
    this.router.mountOnto(app);
    return app;
  }
}

export default ParseCliServer;
export {
    ParseCliServer
};
