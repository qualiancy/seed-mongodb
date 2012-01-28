var Seed;

try {
  Seed = require('seed');
} catch (ex) {
  console.error('Cannon find module seed. Is it installed?');
  process.exit(1);
}

var Store = Seed.Store
  , mongodb = require('mongodb');

var MongoStore = Store.extend({

  name: 'MongoStore'

  , MIN_SEED_VERSION: '0.1.9'

/**
 * Initialize is called during store construction
 * and it's primary function is to parse options
 * and serve as the constructor for MongoStore.
 *
 * @param {Object} options
 */

  , initialize: function (options) {
    options = options || {};
    this.options = Seed.utils.defaults(options, {
        auto_connect: true
      , auto_reconnect: true
      , hostname: 'localhost'
      , port: mongodb.Connection.DEFAULT_PORT
      , db: null
      , username: null
      , password: null
    });

    var host = this.options.hostname
      , port = this.options.port
      , serveropts = {
          auto_reconnect: this.options.auto_reconnect
        }
      , db = this.options.db;

    if (!db) throw new Seed.SeedError(this.name + ': `db` option required', this.options);

    this.server = new mongodb.Server(host, port, serveropts);
    this.db_connector = new mongodb.Db(db, this.server);
  }

/*!
 * Current status of the connection
 *  0 = disconnected
 *  1 = connected
 *  2 = connecting
 *  3 = disconnecting
 */

  , connectionState: 0

/**
 * Over-riding the default sync option
 * to ensure connection is established
 * prior to issuing a request to `action`
 */

  , sync: function (action, model, query) {
    var data = (model) ? model._attributes : null
      , collection = model.type;
    var oath = this[action]({
        data: data
      , collection: collection
      , query: query || {}
    });
    return oath;
  }

  , get: function (seed) {

  }

  , set: function (seed) {

  }

  , fetch: function (seed) {

  }

  , destroy: function (seed) {

  }

});

module.exports = MongoStore;

function connectMongo(store, promise, options) {

}
