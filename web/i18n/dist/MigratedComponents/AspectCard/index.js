"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _bind = _interopRequireDefault(require("classnames/bind"));

var _Card = _interopRequireDefault(require("@material-ui/core/Card"));

var _Grid = _interopRequireDefault(require("@material-ui/core/Grid"));

var _AspectTitle = _interopRequireDefault(require("../AspectTitle"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const cssClasses = _bind.default.bind(require('./Card.css'));

const CardHeader = ({
  props
}) => {
  const {
    title,
    actionComponent,
    action
  } = props;
  const {
    component: ActionComponent,
    props: actionComponentProps
  } = actionComponent;
  return title || actionComponent ? /*#__PURE__*/_react.default.createElement(_Grid.default, {
    item: true,
    xs: 12
  }, /*#__PURE__*/_react.default.createElement(_Grid.default, {
    container: true,
    spacing: 24,
    className: cssClasses('card__headerContainer')
  }, title ? /*#__PURE__*/_react.default.createElement(_Grid.default, {
    item: true,
    xs: 6,
    className: cssClasses('card__title')
  }, /*#__PURE__*/_react.default.createElement(_AspectTitle.default, {
    title: title
  })) : null, actionComponent ? /*#__PURE__*/_react.default.createElement(_Grid.default, {
    item: true,
    xs: 6,
    className: cssClasses('card__actionsContainer')
  }, /*#__PURE__*/_react.default.createElement(ActionComponent, {
    props: {
      actionComponentProps,
      action
    }
  })) : null)) : null;
};

const AspectCard = ({
  children,
  justify,
  innerSize,
  title,
  actionComponent,
  action
}) => {
  return /*#__PURE__*/_react.default.createElement(_Card.default, {
    className: cssClasses('card__container')
  }, /*#__PURE__*/_react.default.createElement(_Grid.default, {
    container: true,
    justify: justify,
    className: cssClasses('card__grid')
  }, /*#__PURE__*/_react.default.createElement(CardHeader, {
    props: {
      title,
      actionComponent,
      action
    }
  }), /*#__PURE__*/_react.default.createElement(_Grid.default, {
    item: true,
    xs: 12,
    lg: innerSize,
    className: cssClasses('card__content')
  }, children)));
};

AspectCard.defaultProps = {
  justify: 'center',
  innerSize: 12
};
AspectCard.protoTypes = {
  children: _propTypes.default.oneOfType([_propTypes.default.object]).isRequired,
  justify: _propTypes.default.string,
  innerSize: _propTypes.default.instanceOf,
  title: _propTypes.default.string.isRequired
};
var _default = AspectCard;
exports.default = _default;