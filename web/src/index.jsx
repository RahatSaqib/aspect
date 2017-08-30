// This is the entry point for our app
import 'core-js/shim'
import 'whatwg-fetch'
import 'url-search-params-polyfill'
import _ from 'lodash'
import React from 'react'
import { render } from 'react-dom'
import { overrideComponentTypeChecker } from 'react-toolbox/lib/utils/is-component-of-type'
import injectTapEventPlugin from 'react-tap-event-plugin'

import config from './config'
import store from './store'
import { getRefreshToken } from './shared/utils/localStorage'
import { refreshStart, hydrateFromLocalStorage } from './auth/AuthRedux'
import './index.css'
import appFactory from './globals/factories/appFactory'

if (config.sentry) {
  // using require here since import only allowed at top-level
  const Raven = require('raven-js')
  Raven.config(config.sentry.dsn).install()
}

// This won't be necessary when facebook updates react
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin()

// polyfill intl if necessary
// http://formatjs.io/guides/runtime-environments/
if (!window.Intl) {
  require('intl')
  // TODO: base on user's locale
  require('intl/locale-data/jsonp/en.js')
}

if (process.env.NODE_ENV === 'development') {
  // TODO: workaround: https://github.com/garbles/why-did-you-update/issues/45
  // eslint-disable-next-line no-unused-vars
  let createClass = React.createClass
  Object.defineProperty(React, 'createClass', {
    set: nextCreateClass => {
      createClass = nextCreateClass
    },
  })
  const { whyDidYouUpdate } = require('why-did-you-update')
  whyDidYouUpdate(React, {
    exclude: new RegExp(
      `^(${[
        'Themed|Button|MenuItem|Overlay|ProgressBar|Layout|AppBar|Dialog',
        'AutoLockScrolling|IconMenu|Router|Route|IconButton|ActivableRenderer',
        'BeforeAfterWrapper|TextField|EnhancedButton|NavigationArrowDropDown',
        'SvgIcon|TouchRipple|DropDownMenu|SelectField|AutoComplete|Card|Paper',
      ].join('|')})`
    ),
  })
}

// Refresh the access token every 30 minutes.
// this could probably be done more elegantly in a component
// but it works for now
setInterval(() => {
  store.dispatch(refreshStart())
}, 30 * 60 * 1000)

overrideComponentTypeChecker(
  (classType, reactElement) =>
    React.createElement(classType).type === reactElement.type
)

const appDom = document.getElementById('app')

const renderApp = () => render(appFactory(_.noop)({ store }), appDom)

// If found a access token, refresh it before initial rendering
new Promise(resolve => {
  // get new access token on refresh/startup
  if (getRefreshToken()) {
    // let's see if we can get culture from local storage
    store.dispatch(hydrateFromLocalStorage())

    // get new access token
    store.dispatch(refreshStart()).then(resolve, resolve)
  } else {
    resolve()
  }
}).then(renderApp)

if (module.hot) {
  module.hot.accept('./globals/factories/appFactory', renderApp)
}
