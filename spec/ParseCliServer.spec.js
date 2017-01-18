import express from 'express';
import http from 'http';

import ParseCliServer from '../lib/ParseCliServer';
import VendorAdapter from '../lib/VendorAdapter';

var server;
let port = 9877;

const configureServer = () => {
  return new Promise((resolve, reject) => {
    try {
      let app = express();
      app.use(new ParseCliServer({
        config: {
          appId: 'APPLICATION_ID',
          masterKey: 'MASTER_KEY',
        }
      }).app);
      app.use((req, res) => {
        fail('should not call next');
      });
      server = app.listen(port);
      resolve();
    } catch(error) {
      reject(error);
    }
  });
}
const reconfigureServer = () => {
  return server.close(() => {
    return configureServer();
  });
}

describe('ParseCliServer', () => {
  configureServer();
  //beforeEach(reconfigureServer);

  function makeRequest(headers, callback) {
    http.request({
      method: 'GET',
      path: '/apps',
      headers: headers,
      host: 'localhost',
      port: port,
    }, callback).end();
  }

  describe('route isSupported', () => {
  });

  describe('AccountKey must be loaded', () => {
    it('AccountKey header is just loaded', (done) => {
      makeRequest({
        'X-Parse-Account-Key': 'xxx'
      }, res => {
        expect(res.statusCode).toEqual(200);
        done();
      });
    });
    /* the default vendorAdapter accept any email with password=masterKey */
    it('Accept correct password', (done) => {
      makeRequest({
        'X-Parse-Email': 'test@example.com',
        'X-Parse-Password': 'MASTER_KEY',
      }, res => {
        expect(res.statusCode).toEqual(200);
        done();
      });
    });
    it('Reject wrong password', (done) => {
      makeRequest({
        'X-Parse-Email': 'test@example.com',
        'X-Parse-Password': '42',
      }, res => {
        expect(res.statusCode).toMatch(/40[0-1]/);
        done();
      });
    });
  });
});
