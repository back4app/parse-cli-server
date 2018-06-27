import { LogsRouter as _LogsRouter } from 'parse-server/lib/Routers/LogsRouter';
import * as middlewares from "parse-server/lib/middlewares";

export default class LogsRouter extends _LogsRouter {

    handleGET(req) {
        let startTime = req.query.startTime;
        if (startTime) {
            startTime = JSON.parse(startTime);
            if (startTime.__type === 'Date') {
                startTime = startTime.iso;
            }
            req.query.from = startTime;
        }
        return super.handleGET(req)
        .then(response => {
            // remove logs exactly at startTime
            response.response = response.response.filter(log => {
                return log.timestamp != startTime;
            });
            return response;
        })
        .then(this._patchResponse);
    }

    _patchResponse(response) {
        response.response.forEach(log => {
            log.timestamp = {
                __type: 'Date',
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
