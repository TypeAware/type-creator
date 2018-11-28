'use strict';

import * as fs from 'fs';
import * as path from "path";
import {Generation} from "../../../generators";
import {Transform, Writable} from "stream";

/////////////////////////////////////////////////////

const index_p = process.argv.indexOf('-p') + 1;
const generatorPath = process.argv[index_p];

const index_o = process.argv.indexOf('-o') + 1;
const outputDir = process.argv[index_o];

const index_i = process.argv.indexOf('-i') + 1;
const inputFile = process.argv[index_i];

const index_f = process.argv.indexOf('-f') + 1;
const outputFile = process.argv[index_f];

const {generation} = <{generation:Generation}>require(generatorPath);

// const strm = fs.createWriteStream(path.resolve(outputDir + '/foo1.js'));


// const t = new Transform({
//   transform(chunk, enc, cb){
//     // console.log({chunk: String(chunk)});
//     cb(null,String(chunk));
//   }
// });

const file = path.resolve(outputDir + '/' + outputFile);

const t : any = null;
// const t = fs.createWriteStream(file, {flags: 'a', encoding: 'utf-8'});
// // t.pipe(fs.createWriteStream(file, {flags: 'w', encoding: 'utf-8',mode: 0o666}));
//
// t.write('zooooom', function(){
//   console.log('flushed');
// });

// console.log('super');
// t.push('fudge');

const {tc} = require(inputFile);

const v = tc.entitiesMap.get('default');

// console.log({v});
// console.log({generation});

if(generation.generateToFiles){
  
  
  generation.generateToFiles(outputDir,v, err => {
  
    if(err){
      throw err;
    }
  
    console.log('Looks like things went well.');
    process.exit(0);
    
  });
  
}
else{
  
  generation.generateToStream(v, t, file, err => {
    
    
    if(err){
      throw err;
    }
    
    console.log('Looks like things went well.');
    process.exit(0);
    
  });
}







