import { jsdom } from 'jsdom';
/* eslint-disable no-var*/

process.env.NODE_ENV = 'test';

require.extensions['.css'] = function () {return null;};
require.extensions['.png'] = function () {return null;};
require.extensions['.jpg'] = function () {return null;};

global.document = jsdom('');
global.window = document.defaultView;

global.navigator = {
  userAgent: 'node.js'
};

const path = require('path');
const args = require('minimist')(process.argv.slice(2));

// Set the correct environment
let env;
if (args._.length > 0 && args._.indexOf('start') !== -1) {
  env = 'test';
} else if (args.env) {
  env = args.env;
} else {
  env = 'dev';
}
process.env.REACT_WEBPACK_ENV = env;
