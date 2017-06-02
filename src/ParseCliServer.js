import express from 'express';
import bodyParser from 'body-parser';

import AppCache from 'parse-server/lib/cache';

import ParseCliController from './ParseCliController';
import ParseCliRouter from './ParseCliRouter';
import FunctionsRouter from './FunctionsRouter';
import HooksRouter from './HooksRouter';
import LogsRouter from './LogsRouter';
import VendorAdapter from './VendorAdapter';

// Fix wrong `this` in app scope
var self;

class ParseCliServer {
  constructor({
    config,
    vendorAdapter,
    logsRouter,
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

    /*
     * The server can use a different structure for logs,
     * make them pass the logsRouter.
     */
    if (!logsRouter)
      logsRouter = new LogsRouter()

    this.logsRouter = logsRouter;
    self = this;
  }

  app() {
    var _app = express();
    /*
     * parse-cli always send json bodies, except for the `logs`
     * command, that is send as an urlencoded body.
     * parse-cli don't send a Content-Type header
     * or in some cases send an unexpected value like
     * application/octet-stream.
     * express request length limit is very low. Change limit value
     * for fix 'big' files deploy problems.
     */
    _app.use(bodyParser.urlencoded({ type: () => { return true }, extended: false, limit: self.length_limit }))
    _app.use(bodyParser.json({ type: () => { return true }, limit: self.length_limit }));

    self.router.mountOnto(_app);

    let functionsRouter = new FunctionsRouter();
    functionsRouter.mountOnto(app);

    let hooksRouter = new HooksRouter();
    hooksRouter.mountOnto(_app);

    self.logsRouter.mountOnto(_app);
    return _app;
  }
}

export default ParseCliServer;
export {
  ParseCliServer
};
