
var exports = module.exports = require('dragonfly')('SeedMongoError');

exports.register('no db', {
    message: 'MongoStore requires a db options'
  , code: 'EBADOPTION'
  , ctx: 'MongoStore'
});

exports.register('no conn', {
    message: 'MongoStore is not connected'
  , code: 'ENOCONN'
  , ctx: 'MongoStore'
});

exports.register('no set name', {
    message: 'MongoStore replica set requires name.'
  , code: 'EBADOPTION'
  , ctx: 'MongoStore'
});

exports.register('repl bad host', {
    message: 'MongoStore replica set bad server options'
  , code: 'EBADOPTIONS'
  , ctx: 'MongoStore'
});
