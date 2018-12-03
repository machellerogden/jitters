#!/usr/bin/env node
'use strict';

module.exports = JSONStream;

const fs = require('fs');
const { pipe } = require('needful');
const streamify = require('async-stream-generator');

const isStructStart = v => [ '{', '[' ].includes(v);
const isStructEnd = v => [ '}', ']' ].includes(v);

async function* read(chunks) {
    let depth = 0;
    let result = '';

    for await (const chunk of chunks) {
        let chars = (typeof chunk === 'string'
            ? chunk
            : chunk.toString()).split('');
        let i = 0;

        while (i < chars.length) {

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
}

function JSONStream(stream = fs.createReadStream(null, {
    fd: 0,
    encoding: 'utf8'
})) {
    return pipe(read, streamify)(stream);
}
