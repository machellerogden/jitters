'use strict';

const test = require('tape-async');
const fs = require('fs');
const path = require('path');

const fixtureStream_path = path.join(__dirname, 'fixture.json')
const fixtureCollection_path = path.join(__dirname, 'fixture_coll.json')

const fixture_data = JSON.parse(fs.readFileSync(fixtureCollection_path, 'utf8'));

const {
    Read,
    Take
} = require('..');

test('Read - collection', async t => {
    t.plan(fixture_data.length);

    let i = 0;
    for await (const item of Read(true)(fs.createReadStream(fixtureCollection_path))) {
        t.deepEqual(item, fixture_data[i]);
        i++;
    }

    t.end();
});

test('Read - stream', async t => {
    t.plan(fixture_data.length);

    let i = 0;
    for await (const item of Read()(fs.createReadStream(fixtureStream_path))) {
        t.deepEqual(item, fixture_data[i]);
        i++;
    }

    t.end();
});

test('Take - collection', async t => {
    t.plan(1);

    let i = 0;
    const results = await Take(3, Read(true)(fs.createReadStream(fixtureCollection_path)));
    t.deepEqual(results, fixture_data.slice(0, 3));

    t.end();
});

test('Take - stream', async t => {
    t.plan(1);

    let i = 0;
    const results = await Take(3, Read()(fs.createReadStream(fixtureStream_path)));
    t.deepEqual(results, fixture_data.slice(0, 3));

    t.end();
});
