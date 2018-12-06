#!/usr/bin/env node
'use strict';

module.exports = {
    Read,
    Take,
    JSONStream
};

const fs = require('fs');
const { pipe } = require('needful');
const streamify = require('async-stream-generator');

const isArrayStart = v => v === '[';
const isArrayEnd = v => v === ']';
const isStructStart = v => [ '{', '[' ].includes(v);
const isStructEnd = v => [ '}', ']' ].includes(v);
const isComma = v => v === ',';

function Read(flatten) {
    let pending = true;
    return async function* read(chunks) {
        let depth = 0;
        let result = '';

        for await (const chunk of chunks) {

            let str = typeof chunk === 'string'
                ? chunk
                : chunk.toString();

            let i = 0;

            if (flatten && (pending || !result.trim())) {
                const [ hit ] = /^\s*(\[)/.exec(str) || [];
                if (hit) {
                    pending = false;
                    str = str.slice(hit.length + 2);
                }
            }

            let chars = str.split('');

            while (i < chars.length) {

                if (flatten && depth === 0) {
                    if (pending && isArrayStart(chars[i])) {
                        i++;
                        pending = false;
                        continue;
                    }
                    if (isComma(chars[i])) {
                        i++;
                        continue;
                    }
                    if (isArrayEnd(chars[i])) {
                        i++;
                        pending = true;
                        continue;
                    }
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

function Take(...args) {
    const [ count, iterator ] = args;
    const fn = async function take(it) {
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

function JSONStream(flatten) {
    return function _JSONStream(stream = fs.createReadStream(null, {
        fd: 0,
        encoding: 'utf8'
    })) {
        return pipe(Read(flatten), streamify)(stream);
    };
}
