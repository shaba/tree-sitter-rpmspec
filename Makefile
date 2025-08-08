TS ?= tree-sitter

configure:
	cmake -B build

build:
	$(TS) generate
	cmake --build build

test: all
	$(TS) test

all: build

.PHONY: all configure build test
