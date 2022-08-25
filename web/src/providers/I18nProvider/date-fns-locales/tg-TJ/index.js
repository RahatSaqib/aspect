'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.default = void 0

var _index = _interopRequireDefault(require('../uz-Cyrl/_lib/formatDistance/index.js'))

var _index2 = _interopRequireDefault(require('../uz-Cyrl/_lib/formatRelative/index.js'))

var _index3 = _interopRequireDefault(require('../uz-Cyrl/_lib/formatLong/index.js'))

var _index4 = _interopRequireDefault(require('../uz-Cyrl/_lib/localize/index.js'))

var _index5 = _interopRequireDefault(require('../uz-Cyrl/_lib/match/index.js'))

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

// Same as uz-Cyrl

/**
 * @type {Locale}
 * @category Locales
 * @summary Tajik Locale (Tajikistan).
 * @language Tajik
 * @iso-639-2 tgk
 * @author David Potgieter [@david-potgieter](https://github.com/david-potgieter)
 */
var locale = {
  code: 'tg-TJ',
  formatDistance: _index.default,
  formatLong: _index3.default,
  formatRelative: _index2.default,
  localize: _index4.default,
  match: _index5.default,
  options: {
    weekStartsOn: 1,
    /* Monday */
    firstWeekContainsDate: 1,
  },
}
var _default = locale
exports.default = _default
module.exports = exports.default
