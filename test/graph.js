var should = require('chai').should()
  , Seed = require('seed')
  , mongodb = require('mongodb');

var MongoStore = require('..');

var testopts = {
    auto_connect: false
  , host: 'localhost'
  , port: 27017
  , db: 'mongostore_test_graphs'
}

describe('MongoStore being used in the GRAPH context', function () {
  var store = new MongoStore(testopts)
    , graph = new Seed.Graph({
        store: store
      });

  var Person = Seed.Model.extend('person', {})
    , Location = Seed.Model.extend('location', {});

  graph.define(Person);
  graph.define(Location);

  var arthur = {
      id: 'arthur'
    , name: 'Arthur Dent'
    , stats: {
          origin: 'Earth'
        , species: 'human'
      }
  };

  var ford = {
      id: 'ford'
    , name: 'Ford Prefect'
    , stats: {
          origin: 'Betelgeuse-ish'
        , species: 'writer'
      }
  };

  var earth = {
      id: 'earth'
    , name: 'Den\'s Planet Earth'
  };

  var ship = {
      id: 'gold'
    , name: 'Starship Heart of Gold'
  };

  before(store.connect.bind(store));
  after(function (done) {
    store.db.dropDatabase();
    store.close(done);
  });

  beforeEach(function () {
    graph.flush();
  });

  it('should allow for new objects to be created', function (done) {
    graph.set('/person/' + arthur.id, arthur);
    graph.set('/person/' + ford.id, ford);
    graph.set('/location/' + earth.id, earth);
    graph.set('/location/' + ship.id, ship);

    graph.push(function (err) {
      should.not.exist(err);
      store.db.collections(function (err, cols) {
        should.not.exist(err);
        cols.length.should.be.above(1);
        done();
      });
    });
  });

  it('should allow for already existing objects to be read', function (done) {
    graph.set('/person/' + arthur.id, arthur);
    graph.set('/person/' + ford.id, ford);
    graph.set('/location/' + earth.id, earth);
    graph.set('/location/' + ship.id, ship);

    graph.pull(function (err) {
      should.not.exist(err);
      graph.count.should.equal(4);
      var arthur2 = graph.get('/person/' + arthur.id);
      arthur2.get('name').should.equal(arthur.name);
      arthur2.flag('dirty').should.be.false;
      done()
    });
  });

  it('should allow for all records of a specific type to be fetched', function (done) {
    graph.fetch('person', function (err) {
      should.not.exist(err);
      graph.count.should.equal(2);

      done();
    });
  });

  it('should allow for a subset of existing objects to be selected', function (done) {
    graph.fetch('person', { 'name': arthur.name }, function (err) {
      should.not.exist(err);
      graph.count.should.equal(1);

      var arthur2 = graph.get('/person/' + arthur.id);
      arthur2.get('name').should.equal(arthur.name);
      arthur2.get('stats').should.be.a('object');
      arthur2.flag('dirty').should.be.false;
      done();
    });
  });

  it('should allow for an already existing object to be updated', function (done) {
    graph.fetch('person', function (err) {
      should.not.exist(err);
      graph.count.should.equal(2);

      var arthur2 = graph.get('/person/' + arthur.id);
      arthur2.flag('dirty').should.be.false;
      arthur2.set({ 'name': 'The Traveler' });
      arthur2.flag('dirty').should.be.true;

      graph.push(function (err) {
        should.not.exist(err);

        var confirm = new Person({ id: 'arthur' });
        confirm.store = store;
        confirm.fetch(function (err) {
          should.not.exist(err);
          confirm.get('name').should.equal('The Traveler');
          done();
        });
      });
    });
  });
});
