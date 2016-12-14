import express from 'express';
import bodyParser from 'body-parser';

import AppCache from 'parse-server/lib/cache';

import ParseCliController from './ParseCliController';
import ParseCliRouter from './ParseCliRouter';
import VendorAdapter from './VendorAdapter';

class ParseCliServer {
  constructor({
    config,
    vendorAdapter,
    cloud,
    public_html
  }) {
    if (config) {
      AppCache.put(config.applicationId, config);
    }
    if (!vendorAdapter) {
      vendorAdapter = new VendorAdapter({
        config: config,
        cloud: cloud,
        public_html: public_html
      });
    }
    let controller = new ParseCliController(vendorAdapter);
    this.router = new ParseCliRouter(controller);
  }

  get app() {
    var app = express();
    /*
    parse-cli always send json body but don't send a Content-Type
    header or in some cases send an unexpected value like
    application/octet-stream.
    express request length limit is very low. Change limit value
    for fix 'big' files deploy problems.
    */
    let limit = '500mb';
    app.use(bodyParser.json({type: function() { return true; }, limit: limit}));
    app.use(bodyParser.urlencoded({limit: limit, extend: true}));

    this.router.mountOnto(app);
    return app;
  }
}

export default ParseCliServer;
export {
    ParseCliServer
};
