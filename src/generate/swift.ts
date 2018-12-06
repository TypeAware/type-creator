'use strict';

import * as path from 'path';
import * as assert from 'assert';
import {EVCb, joinMessages, Lang} from '../shared';
import * as util from "util";
import * as symbols from "../symbols";
import {TypeElaboration} from "../type-utils";
import * as stream from "stream";
import * as fs from "fs";

//////////////////////////////////////////////////////

const {conf} = new Lang({lang: 'swift'});

const getString = (v: any) => {
  const ret = v[conf.lang];
  if (!ret) {
    const parent = v && v[symbols.generic.Parent];
    const msg = parent ? 'parent is: ' + util.inspect(parent) : '';
    throw new Error(joinMessages(`Map does not contain key: "${conf.lang}"`, util.inspect(v), msg));
  }
  return ret;
};

const getCleanKeyString = (k: string) => {
  return /[^a-zA-z0-9]/.test(k) ? `'${k}'` : k;
};

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
      
      if (Array.isArray(b)) {
        const pop = getStringFromTypeMap(a.pop());
        // const format = util.format(pop, ...reduceToFlatList(b));
        const format = reduceToFlatList(b).reduce((n, t) => n.replace('?', t), pop);
        return (a.push(format.replace(/\?/g, 'Any')), a); // we replace any remaining "?" chars with "Any" => swifts any type
      }
      
      const str = getStringFromTypeMap(b);
      return (a.push(str), a);
      
    },
    [
      getStringFromTypeMap(list[0])
    ]
  );
};

const verifyLink = function (list: Array<string>, v: any, down: boolean, depth: number): boolean {
  
  if (depth < 0) {
    return false;
  }
  
  const prop = list[0];
  const map = <Map<string, any>>v[symbols.generic.NSRename];
  
  if (!map) {
    throw new Error(
      joinMessages(
        'Could not find not find namespace-map in parent object:',
        util.inspect(v)
      )
    );
  }
  
  const child = map.get(prop);
  
  if (child && list.length === 1) {
    return true;
  }
  
  if (child) {
    const result = verifyLink(list.slice(1), child, true, depth - 1);
    if (result) {
      return true;
    }
  }
  
  if (down) {  // we were traversing down the tree, no need to back up
    return;
  }
  
  const parent = v[symbols.generic.Parent];
  
  if (!parent) {
    throw new Error('Could not find parent link.');
  }
  
  return verifyLink(list, parent, false, depth + 1);
};

const verifyLinkWrapper = (originalLink: string, v: any) => {
  const linkage = originalLink.split('.');
  console.error(verifyLinkWrapper.name, 'being called with:', linkage);
  try {
    const r = verifyLink(linkage, v, false, 0);
    if (r !== true) {
      throw new Error(
        'Could not verify type-link, the return value of validation routine was not true.'
      );
    }
  }
  catch (err) {
    console.error('Could not verify type-link with path:', originalLink);
    throw err;
  }
};

const uniqueMarker = Symbol('unique.swift.marker');

const generateToStream = (input: object, strm: stream.Writable, cb: EVCb<any>) => {
  
  // const input = require(src);
  // assert(input.entities, 'no entities exported from .js file.');
  
  const result = {
    push(d: string) {
      strm.write(d + '\n');
    },
    end() {
      strm.end();
    }
  };
  
  result.push('public class Entities {');
  
  const loop = function (v: any, parent: any, spaceCount: number, withinInterface: boolean) {
    
    if (Array.isArray(v)) {
      throw new Error('Unexpected array object.');
    }
    
    const space = new Array(spaceCount).fill(null).join(' ');
    const rn = v[symbols.generic.NSRename] = new Map<string, any>();
    const currPathStr = v[symbols.generic.PathStr] || '';
    
    if(v[symbols.generic.AddPath] && currPathStr){
      result.push(space + `var TypePath: String = "${currPathStr}"`);
    }
    
    for (let k of Object.keys(v)) {
      
      const rhs = v[k];
      const cleanKey = getCleanKeyString(k);
      const type = typeof rhs;
      
      if (rhs && typeof rhs === 'object') {
        
        if (!rhs[symbols.generic.TypeMap] && rhs[uniqueMarker]) {
          throw new Error(
            'Circular reference detected in the config tree. Circular references not allowed.'
          );
        }
        
        rhs[uniqueMarker] = true;
        rhs[symbols.generic.Parent] = v;
        rhs[symbols.generic.NamespaceName] = k;
        rhs[symbols.generic.PathStr] = [currPathStr, k].filter(Boolean).join('.');
        rn.set(k, rhs);
      }
      
      if (v[symbols.special.chld.Literal] === true) {
        
        if (!(rhs && typeof rhs === 'string')) {
          throw new Error('Parent has a "chld.literal" tag, but child value is not a string.');
        }
        
        result.push(space + `var ${cleanKey}: ${rhs}?`);
        continue;
      }
      
      if (!(rhs && typeof rhs === 'object')) {
        if (!(rhs && typeof rhs === 'string')) {
          throw new Error('Literal type string assumed, but it is not a string or undefined/empty => ' + util.inspect(rhs));
        }
        result.push(space + `var ${cleanKey}: ${rhs}?`);
        continue;
      }
      
      if (rhs[symbols.generic.Literal] === true) {
        
        if (!(rhs.value && typeof rhs.value === 'string')) {
          throw new Error('Has a "literal" tag, but value prop is undefined or is not a string.');
        }
        
        result.push(space + `var ${cleanKey}: ${rhs.value}?`);
        continue;
      }
      
      if (rhs[symbols.generic.TypeLink] === true) {
        {
          const val = rhs.link;
          verifyLinkWrapper(val, rhs);
          result.push(space + `var ${cleanKey}: ${val}?`);
        }
        continue;
      }
      
      if (rhs[symbols.generic.TypeMap] === true) {
        {
          const val = getString(rhs);
          result.push(space + `var ${cleanKey}: ${val}?`);
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
            result.push(space + `var ${cleanKey}: ${val}?`);
          }
          else if (elab.link) {
            verifyLinkWrapper(elab.link, v);
            result.push(space + `var ${cleanKey}: ${elab.link}?`);
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
            
            verifyLinkWrapper(name, v);
            result.push(space + `var ${cleanKey}: ${String(name)}?`);
          }
          else if (elab.compound) {
            // console.error({compaound: elab.compound[1]});
            const flatList = reduceToFlatList(elab.compound);
            console.error({flatList});
            const literalType = flatList.reduceRight((a, b) => {
              return [b, '<', a, '>'].join('');
            });
            result.push(space + `var ${cleanKey}: ${literalType}?`);
          }
          else {
            throw new Error('no link or type ' + util.inspect(elab));
          }
          
        }
        continue;
      }
      
      if (Array.isArray(rhs)) {
        
        {
          const [type, value] = rhs;
          const literalType = getString(type);
          
          if (value === undefined) { // TODO: check array length instead of for undefined
            result.push(space + `var ${cleanKey}: ${literalType}?`);
          }
          else {
            result.push(space + `var ${cleanKey}: ${literalType} = ${value}`);
          }
          
        }
        continue;
      }
      
      let startInterface = rhs[symbols.lang.swift.Class] === true;
      
      if (startInterface) {
        // result.push(space + `static interface ${k} {`);
        result.push(space + `class ${k} {`);
      }
      else {
        result.push(space + `class ${k} {`);
      }
      
      loop(rhs, v, spaceCount + 2, startInterface);
      result.push(space + '}');
      
    }
    
  };
  
  loop(input, null, 2, false);
  result.push('}\n');
  result.end();
  
  process.nextTick(function () {
    
    // console.log(result.join('\n') + '\n}');
    cb(null);
  });
  
};

export const generation = {
  generateToStream,
  filePath: __filename
};

// const f = process.env.input_file;
// generate(path.resolve(f));
