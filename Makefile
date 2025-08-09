TS ?= tree-sitter

default: build

configure:
	cmake -B build

build:
	$(TS) generate
	cmake --build build

test: default
	$(TS) test

fast-test:
	$(TS) test

.PHONY: default configure build test
