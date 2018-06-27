import ParseCliController from '../lib/ParseCliController';

describe('ParseCliController', () => {
    describe('Some functions just calls VendorAdapter', () => {
        let controller;

        beforeEach(() => {
            controller = new ParseCliController({
                getCliLatestVersion: () => {
                    return Promise.resolve('0.1.2');
                },
                getAccountKey: (email, password) => {
                    expect(email).toEqual('test@parsecli');
                    expect(password).toEqual('passwd');
                    return Promise.resolve('ACCOUNT_KEY');
                },
                getEmail: (accountKey) => {
                    expect(accountKey).toEqual('ACCOUNT_KEY');
                    return Promise.resolve('test@parsecli');
                },
                getJsVersions: appId => {
                    expect(appId).toEqual('APPLICATION_ID');
                    return Promise.resolve(['1.2']);
                },
                getApps: accountKey => {
                    expect(accountKey).toEqual('ACCOUNT_KEY');
                    return Promise.resolve('GETAPPS');
                },
                getApp: (accountKey, appId) => {
                    expect(accountKey).toEqual('ACCOUNT_KEY');
                    expect(appId).toEqual('APPLICATION_ID');
                    return Promise.resolve('GETAPP');
                },
                createApp: (accountKey, appName) => {
                    expect(accountKey).toEqual('ACCOUNT_KEY');
                    expect(appName).toEqual('APP_NAME');
                    return Promise.resolve('CREATEAPP');
                },
            });
        });

        it('getCliLatestVersion', (done) => {
            controller.getCliLatestVersion().then(version => {
                expect(version).toEqual('0.1.2');
                done();
            });
        });

        it('getAccountKey', (done) => {
            controller.getAccountKey('test@parsecli', 'passwd').then(accountKey => {
                expect(accountKey).toEqual('ACCOUNT_KEY');
                done();
            });
        });

        it('getEmail', (done) => {
            controller.getEmail('ACCOUNT_KEY').then(email => {
                expect(email).toEqual('test@parsecli');
                done();
            });
        });

        it('getJsVersions', (done) => {
            controller.getJsVersions('APPLICATION_ID').then(versions => {
                expect(versions).toEqual(['1.2']);
                done();
            });
        });

        it('getApps', (done) => {
            controller.getApps('ACCOUNT_KEY').then(parseApps => {
                expect(parseApps).toEqual('GETAPPS');
                done();
            });
        });

        it('getApp', (done) => {
            controller.getApp('ACCOUNT_KEY', 'APPLICATION_ID').then(parseApp => {
                expect(parseApp).toEqual('GETAPP');
                done();
            });
        });

        it('createApp', (done) => {
            controller.createApp('ACCOUNT_KEY', 'APP_NAME').then(parseApp => {
                expect(parseApp).toEqual('CREATEAPP');
                done();
            });
        });
    });
});
