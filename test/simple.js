#!/usr/bin/env node

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const assert = require('assert');
const EE = require('events');
const strm = require('stream');

const foo = function () {
  
  const args = Array.from(arguments);
  console.log('the args:', args);
  const lastArg = args.pop();
  console.log({lastArg});
  lastArg.apply(this, args);
  
};

//
// const bound = foo.bind('A', 1,2,3);
//
// bound.call('B',function(){
//   console.log('this is:', this);
//   console.log(Array.from(arguments));
// });
//
//
//
//
// const binder = function(values, f){
//   return function(){
//     f.apply(this, [...values, ...arguments]);
//   }
// };
//
//
// const f = binder([1,2,3], function (a,b,c,d) {
//   console.log('this is:', this);
//   console.log({a,b,c,d});
// });
//
// f.call('B',4);

Function.prototype.create = function () {
  const fn = this;
  const values = Array.from(arguments);
  return function () {
    fn.call(this, ...values, ...arguments);
  };
};

const created = foo.create(1, 2, 3);

created.call('B', 4, function () {
  console.log('this is:', this);
  console.log(arguments);
});
