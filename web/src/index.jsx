// This is the entry point for our app
import 'core-js/shim'
import 'whatwg-fetch'
import 'url-search-params-polyfill'
import _ from 'lodash'
import React from 'react'
import { render } from 'react-dom'

import config from './config'
import store from './store'
import { hydrateFromLocalStorage, refreshStart } from './auth/AuthRedux'
import './index.css'
import { getAspectHydrateData } from './globals/sideEffects/LocalStorage'
import appFactory from './globals/factories/appFactory'

if (config.sentry) {
  // using require here since import only allowed at top-level
  const Raven = require('raven-js')
  Raven.config(config.sentry.dsn).install()
}

// polyfill intl if necessary
// http://formatjs.io/guides/runtime-environments/
if (!window.Intl) {
  require('intl')
  // TODO: base on user's locale
  require('intl/locale-data/jsonp/en.js')
}

// eslint-disable-next-line no-constant-condition
if (process.env.NODE_ENV === 'development' && false) {
  // TODO: workaround: https://github.com/garbles/why-did-you-update/issues/45
  // eslint-disable-next-line no-unused-vars
  let { createClass } = React
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

const appDom = document.getElementById('app')

const renderApp = () => render(appFactory(_.noop)({ store }), appDom)

// let's see if we can get culture from local storage
store.dispatch(hydrateFromLocalStorage(getAspectHydrateData()))

// get new access token
store.dispatch(refreshStart()).then(renderApp, renderApp)

if (module.hot) {
  module.hot.accept('./globals/factories/appFactory', renderApp)
}
