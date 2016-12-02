import express from 'express';
import bodyParser from 'body-parser';

import ParseCliController from './ParseCliController';
import ParseCliRouter from './ParseCliRouter';
import VendorAdapter from './VendorAdapter';

class ParseCliServer {
  constructor(config, {
    vendorAdapter,
    cloud,
    public_html
  }) {
    if (!vendorAdapter) {
      vendorAdapter = new VendorAdapter(config, {
        cloud: cloud,
        public_html: public_html
      });
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
