'use strict';

export const log = {
  info: console.log.bind(console, 'oredoc:'),
  error: console.error.bind(console, 'oredoc:'),
};

export default log;


