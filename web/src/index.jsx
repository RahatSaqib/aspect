// This is the entry point for our app
import 'core-js/shim'
import 'whatwg-fetch'
import 'url-search-params-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { AppContainer } from 'react-hot-loader'
import injectTapEventPlugin from 'react-tap-event-plugin'

import config from './config'
import store from './store'
import { getRefreshToken } from './shared/utils/localStorage'
import { refreshStart, hydrateFromLocalStorage } from './auth/AuthRedux'
import './favicon.ico?output=../favicon.ico'
import './index.scss'
import Routes from './globals/Routes'

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

// Refresh the access token every 30 minutes.
// this could probably be done more elegantly in a component
// but it works for now
setInterval(() => { store.dispatch(refreshStart()) }, 30 * 60 * 1000)

const appDom = document.getElementById('app')

const render = () => {
  ReactDOM.render(
    <AppContainer>
      <Provider store={store}>
        <Routes />
      </Provider>
    </AppContainer>,
    appDom
  )
}

// If found a access token, refresh it before initial rendering
new Promise((resolve) => {
  // get new access token on refresh/startup
  if (getRefreshToken()) {
    // let's see if we can get culture from local storage
    store.dispatch(hydrateFromLocalStorage())

    // get new access token
    store.dispatch(refreshStart())
      .then(resolve, resolve)
  } else {
    resolve()
  }
}).then(render)

if (module.hot) {
  module.hot.accept('./globals/Routes', render)
}
