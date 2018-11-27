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

export type EVCb<T> = (err: any, val?: T) => void;


export const joinMessages = (...args: string[]) => {
  return args.join(' ');
};
