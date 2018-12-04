'use strict';

import * as symbols from './symbols';
import {LangMap, setTypeMap} from './type-utils';


export interface LangMapMap {
  [key:string]: LangMap
}

export const defaults  = {
  
  Number: setTypeMap({
    golang: 'float32',
    java: 'double',
    typescript: 'number',
    swift: 'double',
    json: '"number"'
  }),
  
  Int: setTypeMap({
    golang: 'int',
    java: 'int',
    typescript: 'number',
    swift: 'int',
    json: '"int"'
  }),
  
  String: setTypeMap({
    golang: 'string',
    java: 'String',
    typescript: 'string',
    swift: 'strAng',
    json: '"string"'
  }),
  
  Boolean: setTypeMap({
    golang: 'bool',
    java: 'boolean',
    typescript: 'boolean',
    swift: 'boolean',
    json: '"boolean"'
  }),
  
  Object: setTypeMap({
    golang: 'struct {}',
    java: `Object`,
    typescript: '{}',
    swift: 'Object',
    json: '{}'
  }),
  
  Map: setTypeMap({
    golang: 'struct {}',
    java: `Map`,
    typescript: '{}',
    swift: 'Object',
    json: '{}'
  }),
  
  Array: setTypeMap({
    golang: '[]',
    java: `List`,
    typescript: 'Array',
    swift: 'DunnoXXX',
    json: '[]'
  }),
  
};


export const defs : LangMapMap = defaults;


export const defaultArrayType = {
  
  'string': defs.String,
  'boolean': defs.Boolean,
  'number': defs.Number,
  'object': defs.Object,
  
  get 'undefined'() {
    throw new Error('Array cannot contain an <undefined> element.');
  },
  get 'symbol'() {
    throw new Error('Array cannot contain a <Symbol> element.');
  }
};



