'use strict';

import * as ts from './generate/typescript';
import {Writable} from "stream";
import {EVCb} from "./shared";

export interface Generation {
  generateToStream: (input: object, strm: Writable, cb: EVCb<any>) => void;
  generate?: () => void;
  filePath: string
}

export interface Task {
  lang: string,
  gen: Generation,
  output: {folder: string}
}

export interface GenerationMap {
  [key: string]: Generation
}

export const generators = {
  
  typescript: ts.generation
  
};

export const gen: GenerationMap = generators;
