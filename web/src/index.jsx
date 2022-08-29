// This is the entry point for our app
import 'whatwg-fetch'
import 'url-search-params-polyfill'
import { render } from 'react-dom'
import * as Sentry from '@sentry/react'
import { Integrations } from '@sentry/tracing'
import React from 'react'
import config from './config'
import store from './store/store'
import { hydrateFromLocalStorage, refreshStart } from './store/AuthRedux'
import './index.css'
import { getAspectHydrateData } from './utils/LocalStorage'
import App from './App'

// Sentry initiaization at the top level of application. I activated it only for production ENV
if (config.sentry && process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: config.sentry.dsn,
    integrations: [
      new Integrations.BrowserTracing({
        tracingOrigins: config.sentry.tracingOrigins || ['localhost:8000', '*.aspect.id'],
      }),
    ],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: config.sentry.tracesSampleRate,
  })
  Sentry.setTag('Country', config.countryName || config.aspectApi)
}
// }

// polyfill intl if necessary
// http://formatjs.io/guides/runtime-environments/
if (!window.Intl) {
  require('intl')
  // TODO: base on user's locale
  require('intl/locale-data/jsonp/en.js')
}

if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render')
  whyDidYouRender(React, {
    trackAllPureComponents: false,
  })
}

const renderApp = () => render(<App store={store} />, document.getElementById('app'))

// let's see if we can get culture from local storage
store.dispatch(hydrateFromLocalStorage(getAspectHydrateData()))

// get new access token
store.dispatch(refreshStart()).then(renderApp, renderApp)

if (module.hot) {
  module.hot.accept('./App', renderApp)
}
