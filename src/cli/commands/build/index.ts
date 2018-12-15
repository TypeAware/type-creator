'use strict';

import * as assert from "assert";
import * as async from 'async';
import * as cp from 'child_process';
import {Task} from "../../../generators";
import * as util from "util";
import * as path from "path";

const run = require.resolve('./run.js');
const inputFile = process.env.input_filex;
const confFile = process.env.conf_filex;

const conf = require(confFile);
const input = require(inputFile);

assert.doesNotThrow(function () {
    assert(conf.default.tasks);
    assert.equal(typeof conf.default.tasks, 'object');
    assert(Array.isArray(conf.default.tasks));
  },
  'conf.default.tasks is not an Array.'
);

assert(
  conf.default.tasks.length > 0,
  'You need at least one language to run against'
);


const tasks : Array<Task> = conf.default.tasks;
const rootBuildFolder = conf.default.buildFolder;

assert(
  rootBuildFolder && typeof rootBuildFolder === 'string',
  'No rootBuildFolder given by task: ' + conf
);


async.eachLimit(tasks, 3, (t, cb) => {

  const generatorPath = t.gen.filePath;
  const outputFolder = t.output.folder;
  const outputFile = t.output.file;

  assert(outputFolder, 'No outputFolder given by task: ' + util.inspect(t));
  assert(generatorPath, 'No filepath given by task: ' + util.inspect(t));
  assert(outputFile, 'No output file given by task: ' + util.inspect(t));
  const outputDir = path.resolve(rootBuildFolder,outputFolder);

  // const k = cp.spawn('bash', [], {
  //     env: Object.assign({}, process.env, {
  //
  //     })
  // });

  const k = cp.spawn('bash');

  const cmd = `
      mkdir -p "${outputDir}";
      node ${run} -p '${generatorPath}' -o '${outputDir}' -i '${inputFile}' -f '${outputFile}';
  `;


  console.log('running cmd:', cmd);
  k.stdout.pipe(process.stdout);
  k.stderr.pipe(process.stderr);

  k.stdin.end(cmd);

  k.once('exit', code => {

    let err = null;

    if(code > 0){
      console.error('Could not run command:', cmd, 'successfully.');
      err = new Error(String(code));
    }

    cb(err);

  });

}, err => {

  if(err){
    throw err;
  }

});
