'use strict';

const test = require('tape-async');
const fs = require('fs');
const path = require('path');

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixture.json'), 'utf8'));

const {
    Read,
    Take
} = require('..');

test('Read', async t => {
    t.plan(fixture.length);

    let i = 0;
    for await (const item of Read(true)(fs.createReadStream(path.join(__dirname, 'fixture.json')))) {
        t.deepEqual(item, fixture[i]);
        i++;
    }

    t.end();
});

test('Take', async t => {
    t.plan(1);

    let i = 0;
    const results = await Take(3, Read(true)(fs.createReadStream(path.join(__dirname, 'fixture.json'))));
    t.deepEqual(results, fixture.slice(0, 3));

    t.end();
});
