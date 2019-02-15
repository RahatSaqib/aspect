"use strict";

var _noop2 = _interopRequireDefault(require("lodash/noop"));

var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _reactIntl = require("react-intl");

var _License = require("./License");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('License component', () => {
  const intlProvider = new _reactIntl.IntlProvider({
    locale: 'en'
  }, {});
  const {
    intl
  } = intlProvider.getChildContext();
  const props = {
    intl,
    licenseContent: 'License here!\nYou better accept!',
    onDoNotAcceptClick: _noop2.default,
    onAcceptClick: _noop2.default
  };
  it('should shallow render without crash', () => {
    (0, _enzyme.shallow)(_react.default.createElement(_License.License, props));
  });
  it('should render the license content with newlines replaced', () => {
    const license = (0, _enzyme.shallow)(_react.default.createElement(_License.License, props));
    expect(license.find('p').at(0).text()).toBe('License here!');
    expect(license.find('p').at(1).text()).toBe('You better accept!');
  });
});