import VendorAdapter from '../lib/VendorAdapter';

describe('VendorAdapter', () => {
    describe('getEmail', () => {
        let adapter;

        beforeEach(() => {
            adapter = new VendorAdapter({
                config: {
                    appName: 'myapp',
                    masterKey: 'MASTER_KEY',
                }
            });
        })
        it('accept masterKey as accountKey and return a fake email', (done) => {
            adapter.getEmail('MASTER_KEY').then(email => {
                expect(email).toEqual('myapp@example.com');
                done();
            });
        });
        it('fails if accountKey is not the masterKey', (done) => {
            adapter.getEmail('xxx').catch(error => {
                expect(error).toEqual('not found');
                done();
            });
        });
    });
});
