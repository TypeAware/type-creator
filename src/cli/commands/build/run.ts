'use strict';

import * as fs from 'fs';
import * as path from "path";
import {Generation} from "../../../generators";

/////////////////////////////////////////////////////

const index_p = process.argv.indexOf('-p') + 1;
const generatorPath = process.argv[index_p];

const index_o = process.argv.indexOf('-o') + 1;
const outputDir = process.argv[index_o];

const index_i = process.argv.indexOf('-i') + 1;
const inputFile = process.argv[index_i];

const gen = <Generation>require(generatorPath);

const strm = fs.createWriteStream(path.resolve(outputDir + '/foo.ts'));

const {tc} = require(inputFile);

const {entities} = tc.entities.get('default');

gen.generateToStream(entities, strm, err => {


  if(err){
    throw err;
  }

  process.exit(0);
  
});





