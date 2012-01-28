# Seed MongoDB [![Build Status](https://secure.travis-ci.org/qualiancy/seed-mongodb.png)](http://travis-ci.org/qualiancy/seed-mongodb)

This module provides a storage engine for [Seed](http://github.com/qualiancy/seed) that allows 
datasets to be stored in MongoDB.

## Installation

Module is available through npm. To use it in your project you must also have `seed` installed,
as it is not provided as `package.json` requirement.

      npm install seed seed-mongodb

## Usage

This storage engine can be used for both models and collections. 

    var Seed = require('seed')
      , MongoStore = require('seed-mongodb')
      , store = new MongoStore({
            db: 'hitchhikersguide'
          , host: 'localhost'
          , port: 27017
        });

    var Person = Seed.Model.extend('person', {
      store: store
    });

    var arthur = new Person({
        id: 'arthur'
      , name: 'Arthur Dent'
      , occupation: 'Traveller'
    });

    arthur.save(function (err) {
      if (err) return console.error(err);
      console.log('Arthur has been saved!');
    });

## Querying

When fetching from a Graph, the queries are passed directly to the mongo database, and should
follow MongoDB's form. For more information, check out [Mongo's Guide on Querying](http://www.mongodb.org/display/DOCS/Mongo+Query+Language)
and the awesome [node-mongo-native](https://github.com/christkv/node-mongodb-native) topic 
on [queries](https://github.com/christkv/node-mongodb-native/blob/master/docs/queries.md).

    var HitchhikersGuide = Seed.Graph.extend({
        store: store
      , initialize: function () {
          this.define(Person);
        }
    });

    var myGuide = new HitchhikersGuide();
    myGuide.fetch('person', { 'name': 'Arthur Dent' }, function (err) {
      var arthur = self.get('/person/arthur');
    });

## Tests

Tests are writting in [Mocha](http://github.com/visionmedia/mocha) using the [Chai](http://chaijs.com)
`should` BDD assertion library. Make sure you have that installed, clone this repo, install dependacies using `npm install`.

    $ make test

You will also need a local installation of MongoDB available on 'localhost:27017' without authentication. Custom
test database options are not provided by default. 

## Getting Help

Please post issues to [GitHub Issues](https://github.com/logicalparadox/seed/issues).
Community forum is available at the [Seed Google Group](https://groups.google.com/group/seedjs-orm).

## Contributors

Interested in contributing? Fork to get started. Contact [@logicalparadox](http://github.com/logicalparadox) 
if you are interested in being regular contributor.

* Jake Luer ([Github: @logicalparadox](http://github.com/logicalparadox)) ([Twitter: @jakeluer](http://twitter.com/jakeluer)) ([Website](http://alogicalparadox.com))

## License

(The MIT License)

Copyright (c) 2012 Jake Luer <jake@alogicalparadox.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
