'use strict';

import * as assert from "assert";
import * as cp from 'child_process';
import * as util from "util";
import * as path from "path";
import {flattenDeep} from '../../../shared';

let inputFile = null;

const index = process.argv.indexOf('-f');

if(index > 0){
  inputFile = process.argv[index + 1];
}


if (!inputFile) {
  inputFile = process.env.tc_symlink_input_file;
}

if(!inputFile){
  inputFile = path.resolve(process.cwd(), 'tc.symlinks.js');
}


const input = require(inputFile);
const symlinks: Array<Symlink> = input && input.default && input.default.symlinks;

assert.doesNotThrow(function () {
    assert(Array.isArray(symlinks));
  },
  'conf.default.tasks is not an Array.'
);

assert(
  input.default.symlinks.length > 0,
  'You need at least one language to run against'
);

interface Symlink {
  src: string,
  dest: string
}

const mapped = symlinks.map(v => {
  
  const baseSrc = path.basename(v.src);
  
  return flattenDeep([v.dest]).map(d => {
  
    const baseDest = path.basename(d);
    const shortDest = path.resolve(String(d).slice(0, -1 * baseDest.length));
    const destPluseBaseSrc = path.resolve(d,baseSrc);
  
    console.log({v});
  
    return [
      `mkdir -p "${shortDest}";`,
      `
      if [[ -L "${d}" ]] || [[ -L "${destPluseBaseSrc}" ]]; then
         ln -sf "${v.src}" "${d}";
      else
         ln -s "${v.src}" "${d}";
      fi
   
    `].join(' ');
    
  });
  
});

const k = cp.spawn('bash');
const cmd = flattenDeep(mapped).join(' ');

console.log({cmd});

k.stdout.pipe(process.stdout);
k.stderr.pipe(process.stderr);
k.stdin.end(cmd);

k.once('exit', code => {
  
  if (code > 0) {
    console.error('Could not run command:', cmd, 'successfully.');
    process.exit(code);
  }
  
  console.log('Symlink routine finished successfully.');
  process.exit(0);
});
  
