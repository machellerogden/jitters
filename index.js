#!/usr/bin/env node
'use strict';

module.exports = {
    read,
    take,
    JSONStream
};

const fs = require('fs');
const { pipe } = require('needful');
const streamify = require('async-stream-generator');

const isStructStart = v => [ '{', '[' ].includes(v);
const isStructEnd = v => [ '}', ']' ].includes(v);
const isComma = v => v === ',';

function read(isCollection) {
    return async function* _read(chunks) {
        let depth = 0;
        let result = '';

        for await (const chunk of chunks) {

            let str = typeof chunk === 'string'
                ? chunk
                : chunk.toString();

            let i = 0;

            if (isCollection && !result.trim()) {
                const [ hit ] = /^\s*(\[)/.exec(str) || [];
                if (hit) {
                    str = str.slice(hit.length + 2);
                } else {
                    throw new Error(`expected collection. actual value recieved: ${str}`);
                }
            }

            let chars = str.split('');

            while (i < chars.length) {

                // skip cases
                if (isCollection && depth === 0 && (
                        isStructEnd(chars[i]) ||
                        isComma(chars[i]))) {
                    i++;
                    continue;
                }

                result += chars[i];

                if (isStructStart(chars[i])) {
                    depth++;
                } else if (isStructEnd(chars[i])) {
                    depth--;
                    if (depth === 0) {
                        yield JSON.parse(result);
                        depth = 0;
                        result = '';
                    }
                }

                i++;
                continue;
            }
        }
    };
}

function take(...args) {
    const [ count, iterator ] = args;
    const fn = async function _take(it) {
        let results = [];
        let i = 0;
        while (i++ < count) {
            let el = await it.next();
            if (el.done) break;
            results.push(el.value);
        }
        return results;
    };
    return iterator
        ? fn(iterator)
        : fn;
}

function JSONStream(isCollection) {
    return function _JSONStream(stream = fs.createReadStream(null, {
        fd: 0,
        encoding: 'utf8'
    })) {
        return pipe(read(isCollection), streamify)(stream);
    };
}
