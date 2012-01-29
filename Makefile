
TESTS = test/*.js
REPORTER = spec
BENCHMARKS = benchmark/*.js

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--timeout 10000 \
		$(TESTS)

benchmark:
	@NODE_ENV=benchmark ./node_modules/.bin/matcha \
		$(BENCHMARKS)

.PHONY: test benchmark
