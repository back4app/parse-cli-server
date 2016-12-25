import express from 'express';
import bodyParser from 'body-parser';

import AppCache from 'parse-server/lib/cache';

import ParseCliController from './ParseCliController';
import ParseCliRouter from './ParseCliRouter';
import HooksRouter from './HooksRouter';
import VendorAdapter from './VendorAdapter';

class ParseCliServer {
  constructor({
    config,
    vendorAdapter,
    cloud,
    public_html
  }) {
    this.length_limit = '500mb';

    if (config) {
      AppCache.put(config.applicationId, config);
      if (config.limit !== undefined) {
        this.length_limit = config.limit;
      }
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
    app.use(bodyParser.json({type: function() { return true; }, limit: this.length_limit}));

    this.router.mountOnto(app);

    let hooksRouter = new HooksRouter();
    hooksRouter.mountOnto(app);

    return app;
  }
}

export default ParseCliServer;
export {
    ParseCliServer
};
