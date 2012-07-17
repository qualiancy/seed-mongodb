
0.6.0 / 2012-07-17 
==================

  * Merge branch 'feature/replsets'
  * add replica set tests (disabled by default)
  * add replica set config errors
  * add replicaset support to store initialize

0.5.0 / 2012-06-26 
==================

  * Merge branch 'refactor/errors'
  * add dragonfly errors
  * file restructure
  * prepare tests for new internals

0.4.0 / 2012-06-25 
==================

  * update mongo dep to 1.0.x
  * test bug fix for traversal object forcing id generation before push
  * tests for nonexistent collections
  * tests for model using schema

0.3.0 / 2012-05-25 
==================

  * dev sep of seed v0.3.x
  * tests passing
  * refactor #set to abide by schemas
  * clean up #sync
  * traversal tests
  * indentation

0.2.5 / 2012-03-26 
==================

  * [bug] proper catch error reference

0.2.4 / 2012-03-17 
==================

  * correctly authenticate

0.2.3 / 2012-03-17 
==================

  * actually send username/pass

0.2.2 / 2012-03-14 
==================

  * try/catch ObjectId conversion and pass back as rejection if error occurs
  * don't travis 0.4.x

0.2.1 / 2012-03-09 
==================

  * graph tests comform to new _id standards
  * model tests conform to new id rules
  * refactor for proper id management
  * added matcha dev dependancy for benchmaring

0.2.0 / 2012-02-27 
==================

  * bencharks seed 0.2.0 compatible
  * tests seed 0.2.0 compatible
  * exports seed 0.2.0 compatible
  * update dep
  * benchmarks

0.1.0 / 2012-01-28 
==================

  * update test to reflect change in host option storage
  * README!
  * changed option.hostname to option.host
  * added seed as dev dep
  * added travis config
  * commenting!
  * all tests passing
  * #fetch is completed - must pass in mongdb valid query
  * started graph tests
  * model destroy tests + cleanup
  * added #destroy
  * longer test timeout as creating collections takes time
  * get now functions + tests
  * added #set w/ tests passing +
  * first round of sync factoring
  * handle connecting, disconnecting
  * basic option parsing + tests
  * getting things ready … tests/package/makefile
  * project init
