var should = require('chai').should()
  , Seed = require('seed')
  , mongodb = require('mongodb');

var MongoStore = require('..');

var testopts = {
    host: 'localhost'
  , port: 27017
  , db: 'mongostore_test'
}

describe('MongoStore', function () {
  it('should have a version', function () {
    MongoStore.version.should.match(/^\d+\.\d+\.\d+$/);
  });

  var store = new MongoStore({ auto_connect: false, db: testopts.db });

  it('should export an instance of Seed.Store', function () {
    store.should.be.instanceof(Seed.Store);
  });

  it('should have the proper seed required fields', function () {
    store.should.have.property('name', 'MongoStore');
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
      var store = new MongoStore({ auto_connect: false, db: testopts.db });
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
      var store = new MongoStore({ auto_connect: false, db: testopts.db });
      store._opts.host.should.equal('localhost');
      store._opts.port.should.equal(27017);
      store._opts.auto_reconnect.should.be.true;
      store._server.should.be.instanceof(mongodb.Server);
      store._dbconn.should.be.instanceof(mongodb.Db);
    });
  });

  describe('connecting to mongodb', function () {
    var opts = Seed.utils.merge({ auto_connect: false }, testopts)
      , store = new MongoStore(opts);

    it('should connect successfully', function (done) {
      store.connect();
      store.connectionState.should.equal(2);
      store.on('connect', function () {
        store.connectionState.should.equal(1);
        done();
      });
    });

    it('should disconnect successfully', function () {
      store.close();
      store.connectionState.should.not.equal(1);
      store.on('disconnect', function () {
        store.connectionState.should.equal(0);
        done();
      });
    });
  });
});
