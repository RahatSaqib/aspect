"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _reactIntl = require("react-intl");

(function () {
  var enterModule = require('react-hot-loader').enterModule;

  enterModule && enterModule(module);
})();

const _default = (0, _reactIntl.defineMessages)({
  title: {
    "id": "pages.AccountDetails.title",
    "defaultMessage": "Account Details"
  },
  usernameAndPassword: {
    "id": "pages.AccountDetails.usernameAndPassword",
    "defaultMessage": "Username & Password"
  }
});

var _default2 = _default;
exports.default = _default2;
;

(function () {
  var reactHotLoader = require('react-hot-loader').default;

  var leaveModule = require('react-hot-loader').leaveModule;

  if (!reactHotLoader) {
    return;
  }

  reactHotLoader.register(_default, "default", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/account/detail/messages.js");
  leaveModule(module);
})();

;