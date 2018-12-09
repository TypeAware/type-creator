'use strict';

import * as path from 'path';
import * as assert from 'assert';
import {generic, lang, special} from '../symbols';
import {defaults, defaultArrayType} from "../defaults";
import {Lang, joinMessages, EVCb} from "../shared";
import * as util from "util";
import {TypeElaboration} from "../type-utils";
import * as stream from "stream";
import * as fs from "fs";

const {conf} = new Lang({lang: 'typescript'});

const getString = (v: any) => {
  
  const ret = v[conf.lang];
  
  if (!ret) {
    throw new Error(joinMessages(`Map does not contain key: "${conf.lang}"`, util.inspect(v)));
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
      
      // console.error({a,b});
      
      if (Array.isArray(b)) {
        const pop = getStringFromTypeMap(a.pop());
        // const format = util.format(pop, ...reduceToFlatList(b));
        const format = reduceToFlatList(b).reduce((n, t) => n.replace('?', t), pop);
        return (a.push(format.replace(/\?/g, 'any')), a); // we replace any remaining "?" chars with "any"
      }
      
      const str = getStringFromTypeMap(b);
      return (a.push(str), a);
      
    },
    
    [
      getStringFromTypeMap(list[0])
    ]
  );
};

// const list = ['Array', 'Map<%s,%s, %s>', ['xxx', 'Map<%s,%s>', ['string', 'boolean'], 'number']];
// console.error(reduceToFlatList(list));

const parentSymbol = Symbol('parent.local');

const appendFileHandler = (err: any, d?: any) => {
  console.error({err,d});
};

const generateToStream = (input: object, strm: stream.Writable, cb: EVCb<any>) => {
  
  
  const outStrm = {
    write(d: string){
      strm.write(d);
    },
    end(){
      strm.end()
    }
  };
  
  
  const result = {
    Entities:{}
  };
  
  
  const loop =  (v: any, parent: any, curr: any, withinInterface: boolean) => {
    
    if (Array.isArray(v)) {
      throw new Error('Unexpected array object.');
    }
  
    const map: {[key:string]: string} = curr['nameMap'] = {};
    const value: any = curr['value'] = {};
    value[parentSymbol] = curr;
    
    
    for (let k of Object.keys(v)) {
      
      const rhs = v[k];
      
      if (rhs && typeof rhs === 'object') {
        map[k] = k;
        rhs[generic.Parent] = v;
        rhs[generic.NamespaceName] = k;
      }
      
      const checkForSymbol = () => {
        return [generic.TypeLink, generic.TypeMap, generic.TypeOptions].some(v => {
          return rhs[v] === true;
        });
      };
      
      const cleanKey = getCleanKeyString(k);
      
      if (!withinInterface) {
        if (cleanKey !== k) {
          throw new Error('Namespace key must not have special characters.');
        }
        
        if (checkForSymbol()) {
          throw new Error('Cannot create a type if you are not within an interface.');
        }
      }
      
      const type = typeof rhs;
      
      if (v[special.chld.Literal] === true) {
        
        if (!(rhs && typeof rhs === 'string')) {
          throw new Error('Parent has a "chld.literal" tag, but child value is not a string.');
        }
        
        value[cleanKey] = rhs;
        // outStrm.write(space + `${cleanKey}: ${rhs},`);
        continue;
      }
      
      if (!(rhs && typeof rhs === 'object')) {
        value[cleanKey] = rhs;
        // outStrm.write(space + `${cleanKey}: '${rhs}',\n`);
        continue;
      }
  
  
      const next : any = {};
      value[cleanKey] =  next;
      next[parentSymbol] = value;
      
      if(withinInterface){
        next['examples'] = [];
      }
      
      
      if (rhs[generic.Literal] === true) {
          value[cleanKey] = rhs.link;
          // outStrm.write(space + `${cleanKey}: ${val},\n`);
        continue;
      }
      
      if (rhs[generic.TypeLink] === true) {
        
          // const val = rhs.link;
          // outStrm.write(space + `${cleanKey}: ${val},\n`);
        value[cleanKey] = rhs.link;
        continue;
      }
      
      if (rhs[generic.TypeMap] === true) {
        {
          const val = getString(rhs);
          value[cleanKey] = val;
          // outStrm.write(space + `${cleanKey}: ${val},\n`);
        }
        continue;
      }
      
      if (rhs[generic.TypeOptions] === true) {
        {
          const elab = <TypeElaboration>rhs.elab;
          
          if (!elab) {
            throw new Error(joinMessages('Missing "elab" property:', util.inspect(rhs)));
          }
          
          if (elab.type) {
            const val = getString(elab);
            value[cleanKey] = val;
            // outStrm.write(space + `${cleanKey}: ${val},\n`);
          }
          else if (elab.link) {
            // outStrm.write(space + `${cleanKey}: ${elab.link},\n`);
            value[cleanKey] = elab.link;
          }
          else if (elab.linkfn) {
            const val = elab.linkfn();
            if (!val) {
              throw new Error('You tried to link to a namespace in the object tree, but which was undefined.');
            }
            const name = (val as any)[generic.NamespaceName];
            if (!name) {
              throw new Error('Cannot refer to a namespace which is not in scope.');
            }
            // outStrm.write(space + `${cleanKey}: ${String(name)},\n`);
            value[cleanKey] = name;
          }
          else if (elab.compound) {
            const flatList = reduceToFlatList(elab.compound);
            const literalType = flatList.reduceRight((a, b) => {
              return [b, '<', a, '>'].join('');
            });
            value[cleanKey] = literalType;
            // outStrm.write(space + `${cleanKey}: ${literalType},\n`);
          }
          else {
            throw new Error('no link or type ' + util.inspect(elab));
          }
          
        }
        continue;
      }
      
      if (Array.isArray(rhs)) {
        {
          
          const firstElem = rhs[0];
          
          if ((<any>rhs)[lang.ts.Inline] === true) {
            throw new Error('ts.inline not yet implemented.');
          }
          else if (firstElem[generic.TypeMap] === true) {
            const literalType = (<any>firstElem)['typescript'];
            value[cleanKey] = `Array<${literalType}>`;
            // outStrm.write(space + `${cleanKey}: Array<${literalType}>\n`);
          }
          else if ((<any>rhs)[generic.Literal] === true) {
            const literalType = rhs.reverse().reduce((a, b) => {
              return [b, '<', a, '>'].join('');
            });
            value[cleanKey] = `Array<${literalType}>`;
            // outStrm.write(space + `${cleanKey}: Array<${literalType}>,\n`);
          }
          else if ((<any>rhs)[generic.TypeMap] === true) {  // (<any>rhs)[simple] === true
            const literalType = (<any>rhs)['typescript'];
            value[cleanKey] = `Array<${literalType}>`;
            // outStrm.write(space + `${cleanKey}: Array<${literalType}>\n`);
          }
          else {
            const literalType = (<any>defaults.Object)['typescript'];
            // outStrm.write(space + `${cleanKey}: Array<${literalType}>\n`);
            value[cleanKey] = `Array<${literalType}>`;
          }
        }
        
        continue;
      }
      
      
      const startInterface = withinInterface || rhs[lang.ts.Interface] === true;
      const startClass = rhs[lang.ts.Class] === true;
      loop(rhs, v, next, startInterface);
      
    }
    
  };
  
  loop(input, null, result.Entities, false);
  
  outStrm.write(JSON.stringify(result, null, 2));
  outStrm.end();
  
  process.nextTick(function(){
    cb(null);
  });
  
};

export const generation = {
  generateToStream,
  filePath: __filename
};

// const f = process.env.input_file;
// generate(path.resolve(f));
