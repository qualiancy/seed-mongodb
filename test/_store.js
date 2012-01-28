var should = require('chai').should()
  , Seed = require('seed');

var MongoStore = require('..');

describe('MongoStore', function () {
  it('should have a version', function () {
    MongoStore.version.should.match(/^\d+\.\d+\.\d+$/);
  });

  var store = new MongoStore({ auto_connect: false, db: 'noop' });

  it('should export an instance of Seed.Store', function () {
    store.should.be.instanceof(Seed.Store);
  });

  it('should have the proper seed required fields', function () {
    store.should.have.property('name', 'MongoStore');
    store.should.have.property('MIN_SEED_VERSION')
      .and.match(/^\d+\.\d+\.\d+$/);
  });

  it('should have the proper functions', function() {
    store.should.have.property('set')
      .and.is.a('function');
    store.should.have.property('get')
      .and.is.a('function');
    store.should.have.property('fetch')
      .and.is.a('function');
    store.should.have.property('destroy')
      .and.is.a('function');
  });

  describe('parsing options', function () {

    it('should only store the options when turning off autoConnect', function (done) {
      var store = new MongoStore({ auto_connect: false, db: 'noop' });
      process.nextTick(function () {
        store.connectionState.should.equal(0);
        done();
      });
    });

    it('should require a database option', function () {
      (function () {
        return new MongoStore();
      }).should.throw(Seed.SeedError);
    });

    it('should use mongo default if no settings are provided', function () {
      var store = new MongoStore({ auto_connect: false, db: 'noop' });
      store.options.hostname.should.equal('localhost');
      store.options.port.should.equal(27017);
      store.options.auto_reconnect.should.be.true;
    });
  });
});
