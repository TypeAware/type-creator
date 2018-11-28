'use strict';

export interface ILang {
  lang: string
}

export class Lang {
  
  conf: ILang;
  
  constructor(v: ILang) {
    this.conf = Object.assign({}, v);
  }
  
}


export const flattenDeep = (v: Array<any>): Array<any> => {
  return v.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), []);
};

export type EVCb<T> = (err: any, val?: T) => void;


export const joinMessages = (...args: string[]) => {
  return args.join(' ');
};
