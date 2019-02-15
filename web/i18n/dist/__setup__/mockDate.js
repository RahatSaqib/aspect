"use strict";

(function () {
  var enterModule = require('react-hot-loader').enterModule;

  enterModule && enterModule(module);
})();

/*
 * Ref: https://github.com/facebook/jest/issues/2234
 */
const MOCKED_DATE_NOW = 1500000000000;
Date.now = jest.fn(() => MOCKED_DATE_NOW);
;

(function () {
  var reactHotLoader = require('react-hot-loader').default;

  var leaveModule = require('react-hot-loader').leaveModule;

  if (!reactHotLoader) {
    return;
  }

  reactHotLoader.register(MOCKED_DATE_NOW, "MOCKED_DATE_NOW", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/__setup__/mockDate.js");
  leaveModule(module);
})();

;