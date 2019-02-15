"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fetchAssays = fetchAssays;
exports.default = assayReducer;
exports.Assay = exports.types = void 0;

var _reactIntl = require("react-intl");

var _immutable = _interopRequireDefault(require("immutable"));

var _differenceInMinutes = _interopRequireDefault(require("date-fns/differenceInMinutes"));

var _fetch = require("../shared/utils/fetch");

var _CommonErrorNotifications = require("../error/CommonErrorNotifications");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function () {
  var enterModule = require('react-hot-loader').enterModule;

  enterModule && enterModule(module);
})();

const types = {
  REQUEST_ASSAYS: 'REQUEST_ASSAYS',
  RECEIVE_ASSAYS: 'RECEIVE_ASSAYS'
  /*
   * ---------------- Action Creators -----------------
   */

};
exports.types = types;

function createRequestAssays() {
  return {
    type: types.REQUEST_ASSAYS
  };
}

function createReceiveAssays(assays) {
  return {
    type: types.RECEIVE_ASSAYS,
    items: assays,
    lastRefreshed: new Date()
  };
}

function fetchAssays(forceRefresh) {
  return (dispatch, getState) => {
    const {
      assay
    } = getState();

    if (assay.loading) {
      return;
    }

    const shouldFetch = forceRefresh || !assay.lastRefreshed || (0, _differenceInMinutes.default)(new Date(), assay.lastRefreshed) > 5; // five minutes

    if (!shouldFetch) {
      return;
    }

    dispatch(createRequestAssays());
    const path = '/assay';
    return (0, _fetch.aspectFetch)(path, {
      errorNotifications: {
        400: (0, _CommonErrorNotifications.filterFieldsRejectedError)((0, _reactIntl.defineMessages)({
          title: {
            "id": "errorResponseMessages.fetchAssays.GET.400.title",
            "defaultMessage": "Searching Assays Failed"
          }
        })),
        default: (0, _CommonErrorNotifications.errorPleaseTryAgainInAFewMinutes)((0, _reactIntl.defineMessages)({
          title: {
            "id": "errorResponseMessages.fetchAssays.GET.default.title",
            "defaultMessage": "Loading Assays Failed"
          }
        }))
      }
    }).then(json => dispatch(createReceiveAssays(json.data)));
  };
}
/*
 * ---------------- Reducers -----------------
 */


const Assay = _immutable.default.Record({
  loading: false,
  items: _immutable.default.List([]),
  lastRefreshed: undefined
});

exports.Assay = Assay;
const initialState = new Assay();

function requestAssays(state) {
  return state.set('loading', true);
}

function receiveAssays(state, assays, lastRefreshed) {
  return state.merge({
    loading: false,
    lastRefreshed,
    items: new _immutable.default.fromJS(assays)
  });
}

function assayReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_ASSAYS:
      return requestAssays(state);

    case types.RECEIVE_ASSAYS:
      return receiveAssays(state, action.items, action.lastRefreshed);

    default:
      return state;
  }
}

;

(function () {
  var reactHotLoader = require('react-hot-loader').default;

  var leaveModule = require('react-hot-loader').leaveModule;

  if (!reactHotLoader) {
    return;
  }

  reactHotLoader.register(types, "types", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/assay/AssayRedux.js");
  reactHotLoader.register(createRequestAssays, "createRequestAssays", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/assay/AssayRedux.js");
  reactHotLoader.register(createReceiveAssays, "createReceiveAssays", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/assay/AssayRedux.js");
  reactHotLoader.register(fetchAssays, "fetchAssays", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/assay/AssayRedux.js");
  reactHotLoader.register(Assay, "Assay", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/assay/AssayRedux.js");
  reactHotLoader.register(initialState, "initialState", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/assay/AssayRedux.js");
  reactHotLoader.register(requestAssays, "requestAssays", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/assay/AssayRedux.js");
  reactHotLoader.register(receiveAssays, "receiveAssays", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/assay/AssayRedux.js");
  reactHotLoader.register(assayReducer, "assayReducer", "/Users/cnagadya/Desktop/SystemOne/aspect/web/src/assay/AssayRedux.js");
  leaveModule(module);
})();

;