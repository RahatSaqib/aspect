// This is the entry point for our app
import 'url-search-params-polyfill'
import React from 'react'
import * as Sentry from '@sentry/react'
import { Integrations } from '@sentry/tracing'
import { render } from 'react-dom'
import App from './App'
import config from './config'
import AllProviders from './providers/AllProviders'
import { refreshStart } from './store/AuthRedux'
import './index.css'
import store from './store/store'

const prepareApp = async () => {
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

  // get new access token
  await store.dispatch(refreshStart())

  return Promise.resolve()
}

const renderApp = () => render(<AppWrapper />, document.getElementById('app'))

const AppWrapper = () => (
  <AllProviders>
    <App />
  </AllProviders>
)

prepareApp().then(renderApp)

if (module.hot) {
  module.hot.accept('./App', renderApp)
}
