// This is the entry point for our app
import 'core-js/fn/object/assign'
import React from 'react'
import promise from 'es6-promise'
import { render } from 'react-dom'
import { Provider } from 'react-redux'

import Routes from './Routes'
import store from './store'
import { getRefreshToken } from './utils/localStorage'
import { refreshStart, hydrateFromLocalStorage } from './action_creators/user_creators'

// This won't be necessary when facebook updates react
// http://stackoverflow.com/a/34015469/988941
import injectTapEventPlugin from 'react-tap-event-plugin'
injectTapEventPlugin()

// polyfill promise if necessary
// http://caniuse.com/#feat=promises
promise.polyfill()

// get new access token on refresh/startup
if (getRefreshToken()){

  // let's see if we can get language and culture from local storage
  store.dispatch(hydrateFromLocalStorage())

  // get new access token
  store.dispatch(refreshStart())
}

// also refresh the access token every 30 minutes.
// this could probably be done more elegantly in a component
// but it works for now
setInterval(() => { store.dispatch(refreshStart()) }, 30 * 60 * 1000)

render(
  <Provider store={store}>
    <Routes />
  </Provider>,
  document.getElementById('app')
)
