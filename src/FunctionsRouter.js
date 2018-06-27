import { FunctionsRouter as _FunctionsRouter } from 'parse-server/lib/Routers/FunctionsRouter';
import * as middlewares from 'parse-server/lib/middlewares';
const express = require('express');

export default class FunctionsRouter extends _FunctionsRouter {
  mountOnto(app) {
    var functionsApp = express();
    functionsApp.use(middlewares.handleParseHeaders);
    super.mountOnto(functionsApp);
    return app.use(functionsApp);
  }
}
