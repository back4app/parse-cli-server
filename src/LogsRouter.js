import { LogsRouter as _LogsRouter } from 'parse-server/lib/Routers/LogsRouter';
import * as middlewares from "parse-server/lib/middlewares";

export default class LogsRouter extends _LogsRouter {

    handleGET(req) {
        return super.handleGET(req).then(this._patchResponse);
    }

    _patchResponse(response) {
        response.response.forEach(log => {
            log.timestamp = {
                // FIXME: don't know if __type is correct
                __type: 'Timestamp',
                iso: log.timestamp,
            };
        });
        return response;
    }

    mountOnto(app) {
        app.use('/scriptlog', middlewares.handleParseHeaders);
        return super.mountOnto(app);
    }
}
