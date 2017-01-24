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
            });
        })

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
    });
});
