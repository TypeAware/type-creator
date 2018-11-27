'use strict';

import * as fs from 'fs';
const index = process.argv.indexOf('-p') + 1;
const generatorPath = process.argv[index];

const gen = require(generatorPath);

const strm = fs.createWriteStream()

