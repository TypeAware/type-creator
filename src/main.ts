'use strict';

export const r2gSmokeTest = function () {
  // r2g command line app uses this exported function
  return true;
};

import * as typeUtils from './type-utils';
import * as defaults from './defaults';
import * as symbols from './symbols';
import {generators} from './generators';

export {generators};


export interface SymbolMap {
  [key:string]: {
    value: symbol,
    kind: string
  }
}

export class TypeCreator {
  
  entitiesMap: Map<string, any> = new Map<string,any>();
  symbolMap: SymbolMap = {};
  
  registerSymbols(m: SymbolMap){
    for(let k of Object.keys(m)){
      this.symbolMap[k] = m[k];
    }
  }
  
  registerEntities<T = any>(namespace: string, e: T) : T {
    this.entitiesMap.set(namespace,e);
    return e;
  }
  
  getTypeUtils(): typeof  typeUtils {
    return typeUtils;
  }
  
  getLangSymbols(): typeof symbols.lang {
    return symbols.lang;
  }
  
  getCommonSymbols(): typeof symbols.generic {
    return symbols.generic;
  }
  
  getDefaults(): typeof defaults {
    return defaults;
  }
  

}

