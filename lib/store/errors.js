
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
