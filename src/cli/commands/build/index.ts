#!/usr/bin/env node
'use strict';

import * as assert from "assert";
import * as async from 'async';
import * as cp from 'child_process';
import {Task} from "../../../generators";
import * as util from "util";
import * as path from "path";

const run = require.resolve('./run');
const inputFile = process.env.input_file;
const confFile = process.env.conf_file;

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
  Object.keys(conf.default.langs).length > 0,
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
  
  
  assert(outputFolder, 'No outputFolder given by task: ' + util.inspect(t));
  assert(generatorPath, 'No filepath given by task: ' + util.inspect(t));
  
  const outputFile = path.resolve(outputFolder,)
  
  const k = cp.spawn('bash', [], {
      env: Object.assign({}, process.env, {
      
      })
  });
  
  const cmd = `
  mkdir -p "${}";
  node ${run} -p "${generatorPath}" -o "${outputFile}";
  `;
  
  k.stdin.end(cmd);

  k.once('exit', code => {
  
    if(code > 0){
      console.error('Could not run command:', cmd, 'successfully.');
    }
  })

}, err => {
  
  if(err){
    throw err;
  }
  
});
