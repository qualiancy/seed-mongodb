var Seed = require('seed')
  , MongoStore = require('..');

suite('CRUD Operations', function () {
  set('type', 'static');
  set('iterations', 5000);

  var UID = new Seed.Flake()
    , keystore = []
    , store = new MongoStore({
          db: 'mongostore_benchmarks_crud'
        , auto_connect: false
      });

  var Rand = Seed.Model.extend('crud', {
    store: store
  });

  // we are going to create a new record to
  // start, as collection creation in mongodb
  // takes a few seconds and would skew numbers
  before(function (done) {
    var first = new Rand();
    first.set({ hello: 'world' });
    store.connect(function () {
      first.save(done);
    });
  });

  after(function(done) {
    store.db.dropDatabase();
    store.close(done);
  });

  bench('create', function (next) {
    var uid = UID.gen()
      , model = new Rand({
          id: uid
        });
    keystore.push(uid);
    model.save(function (ex) {
      if (ex) throw ex;
      next();
    });
  });

  var readpos = 0;
  bench('read', function (next) {
    var uid = keystore[readpos]
      , model = new Rand({
          id: uid
        });
    readpos++;
    model.fetch(function (ex) {
      if (ex) throw ex;
      next();
    });
  });

  var updatepos = 0;
  bench('update', function (next) {
    var uid = keystore[updatepos]
      , model = new Rand({
            id: uid
          , hello: 'world'
        });
    updatepos++;
    model.save(function (ex) {
      if (ex) throw ex;
      next();
    });
  });

  var delpos = 0;
  bench('destroy', function (next) {
    var uid = keystore[delpos]
      , model = new Rand({
          id: uid
        });
    model.destroy(function (ex) {
      if (ex) throw ex;
      next();
    });
  });
});
