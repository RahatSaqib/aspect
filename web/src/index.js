// This is the entry point for our app
import 'react-hot-loader/patch'
import 'core-js/fn/object/assign'
import React from 'react'
import promise from 'es6-promise'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { AppContainer } from 'react-hot-loader'

import config from 'config'
if (config.sentry){
  // using require here since import only allowed at top-level
  const Raven = require('raven-js')
  Raven.config(config.sentry.dsn).install()
}

import Routes from './components/Routes'
import store from './store'
import { getRefreshToken } from './shared/utils/localStorage'
import { refreshStart, hydrateFromLocalStorage } from './auth/AuthRedux'
import './favicon.ico?output=../favicon.ico'

// This won't be necessary when facebook updates react
// http://stackoverflow.com/a/34015469/988941
import injectTapEventPlugin from 'react-tap-event-plugin'
injectTapEventPlugin()

// polyfill promise if necessary
// http://caniuse.com/#feat=promises
promise.polyfill()

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

// If found a access token, refresh it before initial rendering
new Promise(resolve => {
  // get new access token on refresh/startup
  if (getRefreshToken()){

    // let's see if we can get culture from local storage
    store.dispatch(hydrateFromLocalStorage())

    // get new access token
    store.dispatch(refreshStart())
      .then(resolve, resolve)
  } else {
    resolve()
  }
}).then(() => {
  render(
    <AppContainer>
      <Provider store={store}>
        <Routes />
      </Provider>
    </AppContainer>,
    appDom
  )
})

if (module.hot) {
  module.hot.accept('./components/Routes.jsx', () => {
    const NextRoutes = require('./components/Routes.jsx').default

    render(
      <AppContainer>
        <Provider store={store}>
          <NextRoutes />
        </Provider>
      </AppContainer>,
      appDom
    )
  })
}
