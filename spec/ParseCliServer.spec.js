import express from 'express';
import http from 'http';

import AppCache from 'parse-server/lib/cache';
import ParseCliServer from '../lib/ParseCliServer';
import VendorAdapter from '../lib/VendorAdapter';

describe('ParseCliServer', () => {
  let config = AppCache.get('test');

  function makeRequest(headers, callback) {
    http.request({
      method: 'GET',
      host: 'localhost',
      port: 8378,
      path: '/1/apps',
      headers: headers,
    }, callback).end();
  }

  describe('AccountKey must be loaded', () => {
    it('AccountKey header is just loaded', (done) => {
      makeRequest({
        'X-Parse-Account-Key': 'xxx'
      }, res => {
        expect(res.statusCode).toEqual(200);
        done();
      });
    });
    // the default vendorAdapter accept any email with password=masterKey
    it('Accept correct password', (done) => {
      makeRequest({
        'X-Parse-Email': 'test@example.com',
        'X-Parse-Password': 'test',
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
