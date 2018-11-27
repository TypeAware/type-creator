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
    swift: 'double'
  }),
  
  Int: setTypeMap({
    golang: 'int',
    java: 'int',
    typescript: 'number',
    swift: 'int',
  }),
  
  String: setTypeMap({
    golang: 'string',
    java: 'String',
    typescript: 'string',
    swift: 'strAng',
  }),
  
  Boolean: setTypeMap({
    golang: 'bool',
    java: 'boolean',
    typescript: 'boolean',
    swift: 'boolean',
  }),
  
  Object: setTypeMap({
    golang: 'struct {}',
    java: `Object`,
    typescript: '{}',
    swift: 'Object',
  }),
  
  Map: setTypeMap({
    golang: 'struct {}',
    java: `Map`,
    typescript: '{}',
    swift: 'Object',
  }),
  
  Array: setTypeMap({
    golang: '[]',
    java: `List`,
    typescript: 'Array',
    swift: 'DunnoXXX',
  }),
  
};


 const defs : LangMapMap = defaults;


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



