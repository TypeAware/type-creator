'use strict';

import * as path from 'path';
import * as assert from 'assert';
import * as cp from 'child_process';
import * as fs from 'fs'
import {EVCb, joinMessages, Lang} from '../shared';
import * as async from 'async';
import * as util from "util";
import * as symbols from "../symbols";
import {TypeElaboration} from "../type-utils";
import {any} from "async";
import {Writable} from "stream";

const {conf} = new Lang({lang: 'golang'});

const getString = (b: any) => {
  
  if (typeof b === 'string') {
    return b;
  }
  
  const str = b[conf.lang];
  
  if (!(str && typeof str === 'string')) {
    throw new Error(joinMessages(`The following object must have a "${conf.lang}" prop:`, util.inspect(b)));
  }
  
  return str;
};

export type EVCb<T> = (err: any, val?: T) => void;

const getStringFromTypeMap = (b: any): string => {
  
  // if(!(b && b[typeMap] === true)){
  //   throw new Error(joinMessages('The following value must have a typeMap symbol prop:', util.inspect(b)));
  // }
  
  if (typeof b === 'string') {
    return b;
  }
  
  const str = b[conf.lang];
  
  if (!(str && typeof str === 'string')) {
    throw new Error(joinMessages(`The following object must have a "${conf.lang}" prop:`, util.inspect(b)));
  }
  
  return str;
};

const reduceToFlatList = function (list: Array<any>): Array<string> {
  return list.slice(1).reduce((a, b) => {
      
      // console.error({a,b});
      
      if (Array.isArray(b)) {
        const pop = getStringFromTypeMap(a.pop());
        // const format = util.format(pop, ...reduceToFlatList(b));
        const format = reduceToFlatList(b).reduce((n, t) => n.replace('?', t), pop);
        return (a.push(format.replace(/\?/g, 'interface{}')), a); // we replace any remaining "?" chars with "interface{}"
      }
      
      const str = getStringFromTypeMap(b);
      return (a.push(str), a);
      
    },
    
    [
      getStringFromTypeMap(list[0])
    ]
  );
};

const createFileLooper = (strm: Writable, results: Array<any>) => {
  return function loop(v: any, spaceCount: number, depth: number) {
    
    const space = new Array(spaceCount).fill(null).join(' ');
  
    const currPathStr = v[symbols.generic.PathStr] || '';

    
    for (let k of Object.keys(v)) {
      
      const rhs = v[k];
      const upperKey = capFirstChar(k);
      
      if (depth === 0) {
        results.push([{exportedName: upperKey}]);
      }
      
      if (!(rhs && typeof rhs === 'object')) {
        
        if (!(rhs && typeof rhs === 'string')) {
          throw new Error('Literal type string assumed, but it is not a string or undefined/empty.');
        }
        
        if (/[^a-zA-z0-9]/.test(k)) {
          throw new Error(joinMessages('Cannot have weird chars in key:', k));
        }
        
        strm.write(space + `${upperKey} ${rhs}\n`);
        continue;
      }
      
      if (rhs[symbols.generic.Literal] === true) {
        
        if (!(rhs.value && typeof rhs.value === 'string')) {
          throw new Error('Has a "literal" tag, but value prop is undefined or is not a string.');
        }
        
        strm.write(space + `${upperKey} ${rhs.value}\n`);
        continue;
      }
      
      // if (withinInterface) {
      //   console.error('we are witin interface.');
      //   result.push(space + `${k}: {`);
      //   loop(v[k], spaceCount + 2, true);
      //   result.push(space + '}');
      //   continue;
      // }
      
      if (rhs[symbols.generic.TypeLink] === true) {
        {
          const val = rhs.link;
          // verifyLinkWrapper(val, rhs);
          strm.write(space + `${upperKey} ${val}\n`);
        }
        continue;
      }
      
      if (rhs[symbols.generic.TypeMap] === true) {
        {
          const val = getString(rhs);
          strm.write(space + `${upperKey} ${val}\n`);
        }
        continue;
      }
      
      if (rhs[symbols.generic.TypeOptions] === true) {
        {
          const elab = <TypeElaboration>rhs.elab;
          
          if (!elab) {
            throw new Error(joinMessages('Missing "elab" property:', util.inspect(rhs)));
          }
          
          if (elab.type) {
            const val = getString(elab);
            strm.write(space + `${upperKey} ${val}\n`);
          }
          else if (elab.link) {
            strm.write(space + `${upperKey} ${elab.link};`);
          }
          else if (elab.linkfn) {
            
            let val, name;
            try {
              val = elab.linkfn();
              assert(val && typeof val === 'object');
              name = (val as any)[symbols.generic.NamespaceName];
              assert.equal(typeof name, 'string', 'Could not read namespace symbol from namespace object.')
            }
            catch (err) {
              console.error('You tried to link to a namespace in the object tree, but the path was undefined.');
              console.error('Could not load path with linkfn:', String(elab.linkfn));
              throw err;
            }
            
            // verifyLinkWrapper(name, v);
            strm.write(space + `${upperKey} ${String(name)}`);
          }
          else if (elab.compound) {
            // console.error({compaound: elab.compound[1]});
            const flatList = reduceToFlatList(elab.compound);
            console.error({flatList});
            const literalType = flatList.reduceRight((a, b) => {
              return [b, '<', a, '>'].join('');
            });
            strm.write(space + `${upperKey} ${literalType}\n`);
          }
          else {
            throw new Error('no link or type ' + util.inspect(elab));
          }
          
        }
        continue;
      }
      
      if (depth === 0) {
        strm.write(space + `type ${upperKey} struct {\n`);
        {
          let p = [currPathStr, k].filter(Boolean).join('.');
          strm.write(space + ' ' + 'TypePath string `tc:"' + p + '"`\n');
        }
      }
      else {
        strm.write(space + `${upperKey} struct {\n`);
      }
      
      loop(rhs, spaceCount + 2, depth + 1);
      strm.write(space + '}\n\n');
    }
    
  };
};

const handleFile = (v: any, dir: string): Array<any> => {
  
  const bn = path.basename(dir).toLowerCase();
  const f = path.resolve(dir, `${bn}.go`);
  const strm = fs.createWriteStream(f);
  strm.write(`package ${bn}\n\n`);
  const results: Array<any> = [];
  const loop = createFileLooper(strm, results);
  loop(v, 0, 0);
  strm.end('\n');
  return results;
  
};

const capFirstChar = (txt: string): string => {
  return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
};

const getPackageName = (v: any): string => {
  
  const parent = v[symbols.generic.Parent];
  const name = v[symbols.generic.NamespaceName];
  
  if (parent && parent[symbols.generic.NamespaceName]) {
    return getPackageName(parent) + '/' + String(name).toLowerCase();
  }
  
  if (name) {
    return `${name}`  // "one" is the hardcoded oredoc name
  }
  
  return '';
};

const handleFolder = (v: any, dir: string, imports: Array<any>, typeAliasesList: Array<any>): Array<any> => {
  
  const results: Array<any> = [];
  const fileName = path.basename(dir);
  const filePath = path.resolve(dir, fileName + '.go');
  const strm = fs.createWriteStream(filePath);
  strm.write(`package ${fileName}\n\n`);
  
  let packageName = `${fileName}`;
  
  if (v[symbols.generic.Parent]) {
    let newPackageName = getPackageName(v[symbols.generic.Parent]);
    if (newPackageName) {
      packageName = newPackageName + '/' + fileName;
    }
  }
  
  for (let v of imports) {
    strm.write(`import "${packageName}/${v.packageName}"\n`)
  }
  
  if (imports.length > 0) {
    strm.write('\n');
  }
  
  for (let v of typeAliasesList) {
    const long = v.reduceRight((a: string, b: any) => a + b.exportedName, '');
    const short = v.slice(0, -1).reduceRight((a: string, b: any) => a + b.exportedName, '');
    const packageName = v[v.length - 1].exportedName.toLowerCase();
    strm.write(`type ${long} = ${packageName}.${short}\n`);
  }
  
  strm.write('\n');
  
  const loop = createFileLooper(strm, results);
  loop(v, 0, 0);
  
  strm.end();
  
  return results;
  
};

export const generateToFiles = (root: string, input: object, cb: EVCb<any>): void => {
  
  // const input = require(src);
  // assert(input.entities, 'no entities exported from .js file.');
  
  type Task = (cb: EVCb<any>) => void;
  const q = async.queue<Task, any>((task, cb) => task(cb), 8);
  
  const folderMap = new Map<string, boolean>();  // Map<dir,startEntity>
  const circularRefCache = new Set<any>();
  
  const to = setTimeout(() => {
    console.error('timed out.');
  }, 3500);
  
  q.drain = q.error = <any>((err: any) => {
    
    clearTimeout(to);
    
    if (err) {
      throw err;
    }
    
  });
  
  interface Opts {
    spaceCount: number,
    isInterface: boolean,
    startEntity: boolean,
    startFile: boolean
  }
  
  const loop = (dir: string, v: any, parent: any, {startFile, spaceCount, startEntity, isInterface}: Opts, cb: EVCb<Array<any>>) => {
    
    if (Array.isArray(v)) {
      throw new Error('Got unexpected array object.');
    }
    
    q.push(callback => {
      
      const k = cp.spawn('bash');
      k.stdin.end(`mkdir -p "${dir}";`);
      
      k.once('exit', code => {
        
        if (code > 0) {
          throw new Error('Could not create dir.');
        }
        
        callback(null);
        
        const rn = v[symbols.generic.NSRename] = new Map<string, any>();
        const currPathStr = v[symbols.generic.PathStr] || '';
        const space = new Array(spaceCount).fill(null).join(' ');
        spaceCount += 2;
        
        const results: Array<any> = [];
        
        if (startFile) {
          
          for (let r of handleFile(v, dir)) {
            results.push(r);
          }
          
          return cb(null, results);
        }
        
        const keys = Object.keys(v);
        
        async.eachLimit(keys, 5, (k, cb) => {
          
          const rhs = <any>v[k];
          
          if (circularRefCache.has(rhs)) {
            throw new Error(
              'Circular reference detected in the config tree. Circular references not allowed.'
            );
          }
          else {
            circularRefCache.add(rhs);
          }
          
          const keyname = String(k).toLowerCase();
          const nextDir = path.resolve(dir, keyname);
          
          if (rhs && typeof rhs === 'object') {
            rhs[symbols.generic.Parent] = v;
            rhs[symbols.generic.NamespaceName] = k;
            rhs[symbols.generic.PathStr] = [currPathStr, k].filter(Boolean).join('.');
            rn.set(k, rhs);
          }
          
          if (!(rhs && typeof rhs === 'object')) {
            
            if (!startFile) {
              throw new Error('We are not within a .go file, so we cannot handle a non-object value yet.')
            }
            
            const val = getString(rhs);
            
            if (/[^a-zA-z0-9]/.test(k)) {
              k = `'${k}'`;
            }
            
            return cb(null);
          }
          
          const startStruct = rhs[symbols.lang.go.Struct] === true;
          const startFileLocal = startFile || rhs[symbols.lang.go.File] === true;
          const startEntityLocal = startEntity || rhs[symbols.lang.go.Entity] === true;
          
          loop(
            nextDir,
            rhs,
            v,
            {spaceCount, startFile: startFileLocal, isInterface: false, startEntity: startEntityLocal},
            (err, values) => {
            
            for (let v of values) {
              results.push(v.concat({
                exportedName: capFirstChar(k)
              }));
            }
            
            cb(err);
            
          });
          
        }, err => {
          
          // console.log({dir,startEntity});
          
          if (startEntity) {
            
            const imports = keys.map(k => {
              return {
                packageName: String(k).toLowerCase()
              }
            });
            
            for (let r of handleFolder(v, dir, imports, results)) {
              results.push(r);
            }
          }
          
          cb(err, results);
        });
        
      });
    });
    
  };
  
  loop(root, {entities: input}, null, {
      spaceCount: 2,
      startFile: false,
      isInterface: false,
      startEntity: false
    },
    (err, results) => {
      console.log({err});
      cb(err);
    });
  
};

// const root = path.resolve(cwd, 'test/builds/go/src/oredoc');
// generate(root, path.resolve(cwd, 'test/builds/go/src/oredoc/input.js'));

export const generation = {
  generateToFiles,
  filePath: __filename
};
