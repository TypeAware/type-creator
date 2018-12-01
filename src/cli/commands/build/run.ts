'use strict';

import * as fs from 'fs';
import * as path from "path";
import {Generation} from "../../../generators";
import {Transform, Writable} from "stream";

/////////////////////////////////////////////////////

// const index_p = process.argv.indexOf('-p') + 1;
// const generatorPath = process.argv[index_p];
//
// const index_o = process.argv.indexOf('-o') + 1;
// const outputDir = process.argv[index_o];
//
// const index_i = process.argv.indexOf('-i') + 1;
// const inputFile = process.argv[index_i];
//
// const index_f = process.argv.indexOf('-f') + 1;
// const outputFile = process.argv[index_f];

const [
  generatorPath,
  outputDir,
  inputFile,
  outputFile
] = ['-p', '-o', '-i', '-f'].map(v => {
  return process.argv[process.argv.indexOf(v) + 1];
});

const {generation} = <{ generation: Generation }>require(generatorPath);
const {tc} = require(inputFile);
const v = tc.entitiesMap.get('default');


const finish = (err: any) => {
  
    if (err) {
      throw err;
    }
    
    console.log('Looks like things went well, not exiting.');
    // process.exit(0);
    
    setTimeout(()=>{},100);
};


if (generation.generateToFiles) {
  generation.generateToFiles(outputDir, v, finish);
}
else {
  const file = path.resolve(outputDir + '/' + outputFile);
  // t.pipe(fs.createWriteStream(file, {flags: 'w', encoding: 'utf-8',mode: 0o666}));
  const t = fs.createWriteStream(file);
  generation.generateToStream(v, t, finish);
}







