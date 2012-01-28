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
    this.db = null;

    if (this.options.auto_connect) {
      this._connect();
    }
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
 * _connect
 *
 * Promise based connect functionality, used
 * internally but available for those who prefer it.
 *
 * @returns {Promise}
 */

  , _connect: function () {
    var self = this
      , promise = new Seed.Promise();
    if (this.connectionState == 1) {
      promise.resolve();
      return promise.promise;
    } else if (this.connectionState == 2) {
      // TODO: if pending connection fails?
      this.once('connect', function () {
        promise.resolve();
      });
      return promise.promise;
    }

    this.connectionState = 2;
    this.db_connector.open(function (err, db) {
      if (err) {
        self.connectionState = 0;
        self.emit('error', err);
        return promise.reject(err);
      }

      self.db = db;
      self.connectionState = 1;
      self.emit('connect');
      promise.resolve();
    });

    return promise.promise;
  }

/**
 * connect
 *
 * node standard connect function. does not
 * pass back mongodb db handle
 *
 * @param {Function} callback on connect
 * @callback {Error} error if not connected
 */

  , connect: function (cb) {
    cb = cb || function() {};
    this._connect().node(cb);
  }

/**
 * _close
 *
 * Used to disconnect the server. Note that sets
 * disconnect flag and any Seed attempts thereafter
 * will error.
 */

  , _close: function () {
    var self = this
      , promise = new Seed.Promise();
    if (this.connectionState == 0) {
      promise.resolve();
      return promise.promise;
    } else if (this.connectionState == 3) {
      this.db_connector.once('close', function (ex) {
        if (err) return promise.reject(err);
        promise.resolve();
      });
      return promise.promise;
    }

    this.connectionState = 3;
    this.db_connector.close(function () {
      self.connectionState = 0;
      self.emit('close');
      promise.resolve();
    });

    return promise.promise;
  }

/**
 * close
 *
 * node standardized close function
 */

  , close: function (cb) {
    cb = cb || function () {};
    this._close().node(cb);
  }

/**
 * Over-riding the default sync option
 * to ensure connection is established
 * prior to issuing a request to `action`
 */

  , sync: function (action, model, query) {
    var self = this
      , opts = this.options
      , data = (model) ? model._attributes : null
      , collection = model.type
      , promise = new Seed.Promise();

    function makeRequest () {
      var oath = self[action]({
          data: data
        , collection: collection
        , query: query || {}
      });
      oath.then(
          function (obj) {
          promise.resolve(obj);
        }
        , function (err) {
          promise.reject(err);
        }
      );
    }

    switch (this.connectionState) {
      case 0:
        //disconnected
        if (opts.auto_connect || opts.auto_reconnect) {
          // TODO: if doesn't happen after x seconds ... return error
          this.once('connect', makeRequest);
        } else if (!opts.auto_reconnect) {
          var err = new Seed.SeedError(this.name + ': not connected');
          promise.reject(err);
        }
        break;
      case 1:
        //connected
        makeRequest();
        break;
      case 2:
        // connecting
        this.once('connect', makeRequest);
        break;
      case 3:
        // disconnecting
        break;
    }

    return promise.promise;
  }

  , get: function (seed) {
    var self = this
      , promise = new Seed.Promise();
    if (!this.db || this.connectionState != 1) {
      promise.reject(new Seed.SeedError(this.name + ': bad connect'));
      return promise.promise;
    }

    var colname = seed.collection
      , id = seed.data.id;
    this.db.collection(colname, function (err, collection) {
      if (err) return promise.reject(err);
      collection.findOne({ 'id': id }, function (err, obj) {
        if (err) return promise.reject(err);
        promise.resolve(obj);
      });
    });
    return promise.promise;
  }

  , set: function (seed) {
    var self = this
      , promise = new Seed.Promise();
    if (!this.db || this.connectionState != 1) {
      promise.reject(new Seed.SeedError(this.name + ': bad connection'));
      return promise.promise;
    }

    var colname = seed.collection
      , id = seed.data.id;
    this.db.collection(colname, function (err, collection) {
      if (err) return promise.reject(err);
      // TODO: better handling of _id (also in general)
      if (seed.data._id) delete seed.data._id;
      collection.findAndModify(
          { id: id }
        , [[ '_id', 'asc' ]]
        , { $set: seed.data }
        , { new: true, upsert: true }
        , function (err, obj) {
            if (err) return promise.reject(err);
            promise.resolve(obj);
            collection.ensureIndex({ id: 1 });
          });
    });
    return promise.promise;
  }

  , fetch: function (seed) {
    var self = this
      , promise = new Seed.Promise();
    if (!this.db || this.connectionState != 1) {
      promise.reject(new Seed.SeedError(this.name + ': bad connection'));
      return promise.promise;
    }

    var colname = seed.collection
      , query = seed.query || {};
    this.db.collection(colname, function (err, collection) {
      if (err) return promise.reject(err);
      collection.find(query).toArray(function (err, arr) {
        if (err) return promise.reject(err);
        if (!arr) arr = [];
        promise.resolve(arr);
      });
    });
    return promise.promise;
  }

  , destroy: function (seed) {
    var self = this
      , promise = new Seed.Promise();
    if (!this.db || this.connectionState != 1) {
      promise.reject(new Seed.SeedError(this.name + ': bad connection'));
      return promise.promise;
    }

    var colname = seed.collection
      , id = seed.data.id;
    this.db.collection(colname, function (err, collection) {
      if (err) return promise.reject(err);
      collection.findAndModify(
          { 'id': id }
        , [[ '_id', 'asc' ]]
        , {}
        , { remove: true }
        , function (err, obj) {
            if (err) return promise.reject(err);
            promise.resolve();
          });
    });
    return promise.promise;
  }

});

module.exports = MongoStore;

function connectMongo(store, promise, options) {

}
