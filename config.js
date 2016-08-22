require('colors');

let environment = process.env.NODE_ENV || "test"; //Use config.test.js by default
console.log('API configured using config.%s.js. To change this, set the NODE_ENV variable by running \'set NODE_ENV=(your environment)\' in the console'.blue, environment);
let environment_config = require('./config.' + environment.trim());
module.exports = environment_config;
