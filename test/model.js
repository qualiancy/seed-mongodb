var should = require('chai').should()
  , Seed = require('seed')
  , mongodb = require('mongodb');

var MongoStore = require('..');

var testopts = {
    auto_connect: false
  , host: 'localhost'
  , port: 27017
  , db: 'mongostore_test'
}

describe('MongoStore being used in the MODEL context', function () {
  var store = new MongoStore(testopts);

  var Person = Seed.Model.extend('person', {
    store: store
  });

  var arthur = new Person({
      id: 'arthur'
    , name: 'Arthur Dent'
  });

  before(store.connect.bind(store));
  after(function (done) {
    store.close(done);
  });

  it('should allow a new object to be created', function (done) {
    arthur.save(function (err) {
      should.not.exist(err);
      done();
    });
  });

});

