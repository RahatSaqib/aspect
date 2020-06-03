"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _reactRedux = require("react-redux");

var _reactSelect = _interopRequireDefault(require("react-select"));

var _get = _interopRequireDefault(require("lodash/get"));

var _sortBy = _interopRequireDefault(require("lodash/sortBy"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const {
  '--aspect-color-chill-blue-1': aspectChillBlue1,
  '--aspect-color-chill-blue-3': aspectChillBlue3,
  '--aspect-color-white': aspectWhite,
  '--white-lilac-2': lilac2
} = process.env;

const buildCustomStyles = defaultOption => {
  const styles = {
    option: (provided, state) => {
      const {
        isSelected,
        isFocused
      } = state;
      return { ...provided,
        color: isSelected ? aspectWhite : aspectChillBlue1,
        backgroundColor: isSelected && aspectChillBlue3 || isFocused && lilac2
      };
    },
    control: provided => ({ ...provided,
      width: 200,
      backgroundColor: aspectChillBlue1,
      display: 'flex',
      borderRadius: '5px',
      padding: '0 8px 0',
      margin: '0 0 0 5px'
    }),
    placeholder: provided => ({ ...provided,
      color: aspectWhite
    }),
    clearIndicator: provided => ({ ...provided,
      ':hover': aspectWhite,
      color: aspectWhite
    }),
    dropdownIndicator: (provided, state) => ({ ...provided,
      ':hover': aspectWhite,
      color: aspectWhite,
      padding: '8px 0 8px 8px'
    }),
    input: provided => ({ ...provided,
      color: aspectWhite
    }),
    singleValue: (provided, state) => ({ ...provided,
      color: aspectWhite
    })
  };
  return styles;
};

const AspectDropdown = ({
  selectedValue,
  reduxStateId,
  action: dispatchFromRedux,
  identifier,
  data: passedData
}) => {
  const [defaultOption] = (0, _react.useState)(selectedValue);
  const [inputValue, setInputValue] = (0, _react.useState)(false);
  const [data, setData] = (0, _react.useState)(false);
  const reduxData = (0, _reactRedux.useSelector)(state => (0, _get.default)(state.toJS(), reduxStateId));
  (0, _react.useEffect)(() => {
    if (!data) {
      setData(passedData || (0, _sortBy.default)(reduxData, ['name']));
    }
  }, [reduxData]);
  (0, _react.useEffect)(() => {
    if (inputValue) {
      const {
        selectedOption,
        action
      } = inputValue;
      dispatchFromRedux({
        identifier,
        selectedOption,
        action
      });
    }
  }, [inputValue]);
  return data && data.length ? /*#__PURE__*/_react.default.createElement(_reactSelect.default, {
    getOptionLabel: ({
      name
    }) => name,
    getOptionValue: ({
      id
    }) => id,
    isClearable: true,
    options: data,
    placeholder: defaultOption,
    styles: buildCustomStyles(defaultOption),
    onChange: (selectedOption, {
      action
    }) => setInputValue({
      selectedOption,
      action
    })
  }) : null;
};

AspectDropdown.defaultProps = {
  data: false
};
AspectDropdown.propTypes = {
  selectedValue: _propTypes.default.string.isRequired,
  reduxStateId: _propTypes.default.string.isRequired,
  action: _propTypes.default.func.isRequired,
  identifier: _propTypes.default.string.isRequired,
  data: _propTypes.default.bool
};
var _default = AspectDropdown;
exports.default = _default;