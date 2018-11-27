'use strict';

// TODO: all these symbols should be uppercase first char

 interface SymbolMap {
  [key:string]: symbol
}

export const generic = {
  
  Literal: Symbol('literal'),
  Type: Symbol('type'),
  Simple: Symbol('simple.type.inference'),
  Extend: Symbol('generic.extends.keyword'),
  Imports: Symbol('generic.imports.keyword'),
  Optional: Symbol('generic.optional.field'),
  NSRename: Symbol('ns.rename'),
  TypeLink: Symbol('generic.type.link'),
  LinkfnVal: Symbol('linkfn.value'),
  NamespaceName: Symbol('NamespaceName'),
  TypeOptions: Symbol('type.options'),
  Parent: Symbol('parent.key'), // prop that points to parent
  TypeVal: Symbol('type.value'),
  TypeMap: Symbol('type.map'),  // user provides custom object, mapping a language to a type
  SimpleTypeMap: Symbol('simple.type.map'),
};

// local type check
const generik : SymbolMap = generic;

interface SymbolMapMap {
  [key:string]: SymbolMap
}

export const lang = {
  
  go: {
    Struct: Symbol('golang.struct'),
    File: Symbol('golang.file'),  // put all these things in multiple structs in a golang file
    Entity: Symbol('golang.entity') // marks where to put an entity.go file that references all subtypes
  },
  
  ts: {
    Inline: Symbol('typescript.inline'), // inline a type
    Interface: Symbol('typescript.interface'),
    Class: Symbol('typescript.class')
  },
  
  java: {
    Interface: Symbol('java.interface'),
    Class: Symbol('java.class')
  },
  
  swift: {
    Struct: Symbol('swift.struct'),
    Extension: Symbol('swift.extension'),
    Class: Symbol('swift.class')
  },
  
};


export const special = {
  chld: {
    Literal: Symbol('children.literal.type')
  }
};


const lng : SymbolMapMap = lang;


