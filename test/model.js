var should = require('chai').should()
  , Seed = require('seed')
  , mongodb = require('mongodb');

var MongoStore = require('..');

var testopts = {
    auto_connect: false
  , host: 'localhost'
  , port: 27017
  , db: 'mongostore_test_models'
}

describe('MongoStore being used in the MODEL context', function () {
  var store = new MongoStore(testopts);

  var Person = Seed.Model.extend('person', {
    store: store
  });

  var arthur = new Person({
      name: 'Arthur Dent'
    , meta: {
        species: 'Human'
      }
  });

  before(store.connect.bind(store));
  after(function (done) {
    store._db.dropDatabase();
    store.close(done);
  });


  var id;
  it('should allow a new object to be created', function (done) {
    arthur.save(function (err) {
      id = arthur.get('_id');
      should.not.exist(err);
      done();
    });
  });

  it('should allow an already writtin object to be retrieved', function (done) {
    var dent = new Person({
      _id: id
    });

    dent.fetch(function (err) {
      should.not.exist(err);
      dent.get('name').should.equal(arthur.get('name'));
      dent.get('meta.species').should.equal(arthur.get('meta.species'));
      done();
    });
  });

  it('should allow an already written object to be modified', function (done) {
    arthur.set('location', 'earth');
    arthur.save(function (err) {
      should.not.exist(err);
      var confirm = new Person({
          _id: id
      });
      confirm.fetch(function (err) {
        should.not.exist(err);
        confirm.get('location').should.equal(arthur.get('location'));
        confirm.get('meta.species').should.equal(arthur.get('meta.species'));
        done();
      });
    });
  });

  it('should allow for an already existing item to be removed', function (done) {
    arthur.destroy(function (err) {
      should.not.exist(err);
      var confirm = new Person({
        _id: id
      });

      confirm.fetch(function (err) {
        should.exist(err);
        err.name.should.equal('SeedError');
        err.code.should.equal('ENOTFOUND');
        done();
      });
    });
  });

});

describe('MongoStore in the MODEL context with a SCHEMA', function () {
  var store = new MongoStore(testopts);

  var PersonSchema = new Seed.Schema({
      _id: {
          type: String
        , index: true
      }

    , name: String

    , location: String

    , meta: {
        species: String
      }
  });

  var Person = Seed.Model.extend('person', {
      store: store
    , schema: PersonSchema
  });

  var arthur = new Person({
      name: 'Arthur Dent'
    , meta: {
        species: 'Human'
      }
  });

  before(store.connect.bind(store));
  after(function (done) {
    store._db.dropDatabase();
    store.close(done);
  });


  var id;
  it('should allow a new object to be created', function (done) {
    arthur.save(function (err) {
      id = arthur.get('_id');
      should.not.exist(err);
      done();
    });
  });

  it('should allow an already writtin object to be retrieved', function (done) {
    var dent = new Person({
      _id: id
    });

    dent.fetch(function (err) {
      should.not.exist(err);
      dent.get('name').should.equal(arthur.get('name'));
      dent.get('meta.species').should.equal(arthur.get('meta.species'));
      done();
    });
  });

  it('should allow an already written object to be modified', function (done) {
    arthur.set('location', 'earth');
    arthur.save(function (err) {
      should.not.exist(err);
      var confirm = new Person({
          _id: id
      });
      confirm.fetch(function (err) {
        should.not.exist(err);
        confirm.get('location').should.equal(arthur.get('location'));
        confirm.get('meta.species').should.equal(arthur.get('meta.species'));
        done();
      });
    });
  });

  it('should allow for an already existing item to be removed', function (done) {
    arthur.destroy(function (err) {
      should.not.exist(err);
      var confirm = new Person({
        _id: id
      });

      confirm.fetch(function (err) {
        should.exist(err);
        err.name.should.equal('SeedError');
        err.code.should.equal('ENOTFOUND');
        done();
      });
    });
  });
});
