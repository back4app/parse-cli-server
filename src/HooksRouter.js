import { HooksRouter as _HooksRouter } from 'parse-server/lib/Routers/HooksRouter';
import * as middlewares from "parse-server/lib/middlewares";
const express = require('express');

export default class HooksRouter extends _HooksRouter {

    handleGetFunctions(req) {
        return super.handleGetFunctions(req)
        .then(this._patchResponse);
    }

    handleGetTriggers(req) {
        return super.handleGetTriggers(req)
        .then(this._patchResponse);
    }

    _patchResponse(response) {
        return {
            response: {
                results: response.response,
            }
        };
    }

    mountOnto(app) {
        var hooksApp = express();
        hooksApp.use('/hooks', middlewares.handleParseHeaders);
        super.mountOnto(hooksApp);
        return app.use('/1', hooksApp);
    }
}
