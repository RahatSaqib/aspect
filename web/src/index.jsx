// This is the entry point for our app
import 'url-search-params-polyfill'
import React from 'react'
import * as Sentry from '@sentry/react'
import { Integrations } from '@sentry/tracing'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import App from './App'
import config from './config'
import { hydrateFromLocalStorage, refreshStart } from './store/AuthRedux'
import store from './store/store'
import './index.css'
import { getAspectHydrateData } from './utils/LocalStorage'

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

const renderApp = () =>
  render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('app')
  )

// let's see if we can get culture from local storage
store.dispatch(hydrateFromLocalStorage(getAspectHydrateData()))

// get new access token
store.dispatch(refreshStart()).then(renderApp, renderApp)

if (module.hot) {
  module.hot.accept('./App', renderApp)
}
