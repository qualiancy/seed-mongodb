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

  var arthur_raw = {
      name: 'Arthur Dent'
    , stats: {
          origin: 'Earth'
        , species: 'human'
      }
  };

  var ford_raw = {
      name: 'Ford Prefect'
    , stats: {
          origin: 'Betelgeuse-ish'
        , species: 'writer'
      }
  };

  var earth_raw = {
    name: 'Den\'s Planet Earth'
  };

  var ship_raw = {
    name: 'Starship Heart of Gold'
  };

  before(store.connect.bind(store));
  after(function (done) {
    store._db.dropDatabase();
    store.close(done);
  });

  beforeEach(function () {
    graph.flush();
  });


  var arthur_id
    , ford_id
    , earth_id
    , ship_id;

  it('should not error when fetching on an empty db', function (done) {
    graph.fetch('person', {}, function (err) {
      should.not.exist(err);
      done();
    });
  });

  it('should allow for new objects to be created', function (done) {
    var arthur = graph.set('person', arthur_raw)
      , ford = graph.set('person', ford_raw)
      , earth = graph.set('location', earth_raw)
      , ship = graph.set('location', ship_raw);

    graph.push(function (err) {
      should.not.exist(err);
      store._db.collections(function (err, cols) {
        should.not.exist(err);
        cols.length.should.be.above(1);
        arthur_id = arthur.id;
        ford_id = ford.id;
        earth_id = earth.id;
        ship_id = ship.id;
        done();
      });
    });
  });

  it('should allow for already existing objects to be read', function (done) {
    graph.set('person', arthur_id, {});
    graph.set('person', ford_id, {});
    graph.set('location', earth_id, {});
    graph.set('location', ship_id, {});

    graph.pull({ force: true }, function (err) {
      should.not.exist(err);
      graph.length.should.equal(4);
      var arthur2 = graph.get('person', arthur_id);
      arthur2.get('name').should.equal(arthur_raw.name);
      arthur2.flag('dirty').should.be.false;
      done()
    });
  });

  it('should allow for all records of a specific type to be fetched', function (done) {
    graph.fetch('person', function (err) {
      should.not.exist(err);
      graph.length.should.equal(2);
      done();
    });
  });

  it('should allow for a subset of existing objects to be selected', function (done) {
    graph.fetch('person', { 'name': arthur_raw.name }, function (err) {
      should.not.exist(err);
      graph.length.should.equal(1);

      var arthur2 = graph.get('person', arthur_id);
      arthur2.get('name').should.equal(arthur_raw.name);
      arthur2.get('stats').should.be.a('object');
      arthur2.flag('dirty').should.be.false;
      done();
    });
  });

  it('should allow for an already existing object to be updated', function (done) {
    graph.fetch('person', function (err) {
      should.not.exist(err);
      graph.length.should.equal(2);

      var arthur2 = graph.get('person', arthur_id);
      arthur2.flag('dirty').should.be.false;
      arthur2.set('name', 'The Traveler');
      arthur2.flag('dirty').should.be.true;

      graph.push(function (err) {
        should.not.exist(err);

        var confirm = new Person({ _id: arthur_id });
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
