var Seed = require('seed')
  , _ = Seed.utils
  , mongodb = require('mongodb')
  , ObjectId = mongodb.ObjectID
  , url = require('url');

var errors = require('./errors')
  , proto = module.exports = {};

proto.name = 'MongoStore';

/**
* Initialize is called during store construction
* and it's primary function is to parse options
* and serve as the constructor for MongoStore.
*
* @param {Object} options
*/

proto.initialize = function (options) {
  options = options || {};

  if (options.servers) {
    this._opts = Seed.utils.defaults(options, {
        auto_connect: true
      , auto_reconnect: true
      , servers: []
      , rs_name: null
      , db: null
      , username: null
      , password: null
    });

    var opts = this._opts
      , servers = []
      , serveropts = { auto_reconnect: opts.auto_reconnect }
      , db = opts.db
      , rs_name = opts.rs_name;

    if (!db) throw errors.create('no db', this._opts);
    if (!rs_name) throw errors.create('no set name', this._opts);

    options.servers.forEach(function (servopts) {
      var host = servopts.host
        , port = servopts.port;
      if (!host && !port) throw errors.create('repl bad host', servopts);
      var server = new mongodb.Server(host, port, serveropts);
      servers.push(server);
    });

    this._server = new mongodb.ReplSetServers(servers, { rs_name: rs_name });
  } else {
    this._opts = Seed.utils.defaults(options, {
        auto_connect: true
      , auto_reconnect: true
      , host: 'localhost'
      , port: mongodb.Connection.DEFAULT_PORT
      , db: null
      , username: null
      , password: null
    });

    var opts = this._opts
      , host = opts.host
      , port = opts.port
      , serveropts = { auto_reconnect: opts.auto_reconnect }
      , db = opts.db;

    if (!db) throw errors.create('no db', this._opts);

    this._server = new mongodb.Server(host, port, serveropts);
  }

  this._indexes = new Seed.Hash();
  this._dbconn = new mongodb.Db(db, this._server);
  this._db = null;
  if (opts.auto_connect) mongoConnect.call(this);
};

/*!
 * Current status of the connection
 *  0 = disconnected
 *  1 = connected
 *  2 = connecting
 *  3 = disconnecting
 */

proto.connectionState = 0;

/**
 * connect
 *
 * node standard connect function. does not
 * pass back mongodb db handle
 *
 * @param {Function} callback on connect
 * @callback {Error} error if not connected
 */

proto.connect = function (cb) {
  cb = cb || function() {};
  mongoConnect.call(this).node(cb);
};


/**
 * close
 *
 * node standardized close function
 */

proto.close = function (cb) {
  cb = cb || function () {};
  mongoClose.call(this).node(cb);
};

/**
 * Over-riding the default sync option
 * to ensure connection is established
 * prior to issuing a request to `action`
 */

proto.sync = function (action, model, query) {
  var self = this
    , defer = new Seed.Promise()
    , opts = this._opts
    , state = this.connectionState;

  // make the database request
  function makeRequest () {
    var collection = model.type
      , data = (model)
        ? model._attributes
        : null
      , resolve = function (obj) { defer.resolve(obj); }
      , reject = function (ex) { defer.reject(ex); };

    self[action]({
        data: data
      , collection: collection
      , query: query || {}
      , model: model
    }).then(resolve, reject);
  }

  // handle not connected db state
  function noRequest () {
    defer.reject(errors.create('no conn'));
  }

  // decide what to do
  if (state === 1) makeRequest();
  else if (state == 3) noRequest();
  else if (state === 0 || state === 2) {
    if (state == 2 || ( state == 0 && (opts.auto_connect || opts.auto_reconnect)))
      this.once('connect', makeRequest);
    else if (state == 0 && !opts.auto_reconnect)
      noRequest();
  }

  return defer.promise;
};

/**
 * # .get()
 *
 * Read: Get the value of an entry in the store
 * given an ID.
 *
 * @param {Object} seed prepared from `sync`
 */

proto.get = function (seed) {
  var self = this
    , defer = new Seed.Promise();

  if (!this._db || this.connectionState != 1) {
    defer.reject(errors.create('no conn'));
    return defer.promise;
  }

  var colname = seed.collection
    , id = seed.data._id;

  try { id = new ObjectId(id); }
  catch (ex) {
    defer.reject(ex);
    return defer.promise;
  }

  this._db.collection(colname, function (err, collection) {
    if (err) return defer.reject(err);
    collection.findOne({ '_id': id }, function (err, obj) {
      if (err) return defer.reject(err);
      if (!obj) return defer.resolve(null);
      obj._id = obj._id.toString();
      defer.resolve(obj);
    });
  });

  return defer.promise;
};

/**
 * # .set()
 *
 * Create or update: Set the whole value of an entry
 * in the mongo store. Uses mongodb upsert strategy
 *
 * @param {Object} seed prepared from `sync`
 */

proto.set = function (seed) {
  var self = this
    , defer = new Seed.Promise();

  if (!this._db || this.connectionState != 1) {
    defer.reject(errors.create('no conn'));
    return defer.promise;
  }

  var colname = seed.collection
    , rawData = (seed.model && seed.model.schema)
      ? seed.model.schema.getValue(seed.data)
      : seed.data
    , data = _.deepMerge({}, rawData)
    , id = data._id;

  delete data._id;

  try { id = new ObjectId(id); }
  catch (ex) {
    defer.reject(ex);
    return defer.promise;
  }

  function update (collection) {
    collection.findAndModify(
        { _id: id }
      , [ [ '_id', 'asc' ] ]
      , { $set: data }
      , { new: true, upsert: true }
      , function (err, obj) {
          if (err) return defer.reject(err);
          obj._id = obj._id.toString();
          defer.resolve(obj);
        });
  }

  function insert (collection) {
    collection.insert(
        data
      , { safe: true }
      , function (err, obj) {
          if (err) return defer.reject(err);
          var doc = obj[0];
          doc._id = doc._id.toString();
          defer.resolve(doc);
        });
  }

  this._db.collection(colname, function (err, collection) {
    if (err) return defer.reject(err);
    if (id) update(collection);
    else insert(collection);
  });

  return defer.promise;
};

/**
 * # .fetch()
 *
 * Query: Given a valid format MongoDB query,
 * provide an array object to add to the graph.
 *
 * Note: could cause problems if done without a query.
 *
 * @param {Object} seed prepared from `sync`
 */

proto.fetch = function (seed) {
  var self = this
    , defer = new Seed.Promise();

  if (!this._db || this.connectionState != 1) {
    defer.reject(errors.create('no conn'));
    return defer.promise;
  }

  var colname = seed.collection
    , query = seed.query || {};

  this._db.collection(colname, function (err, collection) {
    if (err) return defer.reject(err);
    collection.find(query).toArray(function (err, arr) {
      if (err) return defer.reject(err);
      if (!arr) arr = [];
      arr.forEach(function (item) {
        item._id = item._id.toString();
      });
      defer.resolve(arr);
    });
  });

  return defer.promise;
};

/**
 * # .destroy()
 *
 * Delete a document from the collection using mongodb
 * findAndModify while setting the remove flag.
 *
 * //TODO: should check if collection is empty and remove?
 *
 * @param {Object} seed prepared from `sync`
 */

proto.destroy = function (seed) {
  var self = this
    , defer = new Seed.Promise();

  if (!this._db || this.connectionState != 1) {
    defer.reject(errors.create('no conn'));
    return defer.promise;
  }

  var colname = seed.collection
    , id = seed.data._id;

  try { id = new ObjectId(id); }
  catch (ex) {
    defer.reject(ex);
    return defer.promise;
  }

  this._db.collection(colname, function (err, collection) {
    if (err) return defer.reject(err);
    collection.findAndModify(
        { _id: id }
      , [[ '_id', 'asc' ]]
      , {}
      , { remove: true }
      , function (err, obj) {
          if (err) return defer.reject(err);
          defer.resolve();
        });
  });

  return defer.promise;
}

/**
 * mongoConnect
 *
 * Promise based connect functionality.
 *
 * @returns {Promise}
 * @ctx MongoStore
 */

function mongoConnect () {
  var self = this
    , defer = new Seed.Promise()
    , dbconn = this._dbconn
    , opts = this._opts
    , user = opts.username
    , pass = opts.password;

  // handle if we are already connecting/ed
  if (this.connectionState == 1) {
    defer.resolve();
    return defer.promise;
  } else if (this.connectionState == 2) {
    this.once('connect', function () {
      defer.resolve();
    });
    return defer.promise;
  }

  // set state at connecting
  this.connectionState = 2;

  // should we fail
  function reject (err) {
    self.connectionState = 0;
    self.emit('error', err);
    defer.reject(err);
  }

  // should we succeed
  function resolve (db) {
    self._db = db;
    self.connectionState = 1;
    self.emit('connect');
    defer.resolve();
  }

  // connection callback
  function doConnect (err, db) {
    if (err) return reject(err);
    if (!user && !pass) return resolve(db);

    function authenicate (err, replies) {
      if (err) return reject(err);
      resolve(db);
    }

    dbconn.authenticate(user, pass, authenticate);
  }

  // start connection
  dbconn.open(doConnect);
  return defer.promise;
}

/**
 * _close
 *
 * Used to disconnect the server. Note that sets
 * disconnect flag and any Seed attempts thereafter
 * will error.
 */

function mongoClose () {
  var self = this
    , defer = new Seed.Promise()
    , dbconn = this._dbconn;

  // handle already disconnected
  if (this.connectionState == 0) {
    defer.resolve();
    return defer.promise;

  // handling already closing
  } else if (this.connectionState == 3) {
    dbconn.once('close', function (ex) {
      if (err) return defer.reject(err);
      defer.resolve();
    });
    return defer.promise;
  }

  this.connectionState = 3;
  dbconn.close(function () {
    self.connectionState = 0;
    self.emit('close');
    defer.resolve();
  });

  return defer.promise;
}
