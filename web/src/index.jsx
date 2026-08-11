// This is the entry point for our app
import React from 'react'
import * as Sentry from '@sentry/react'
import { Integrations } from '@sentry/tracing'
import { render } from 'react-dom'
import App from './App'
import config from './config'
import AllProviders from './providers/AllProviders'
import { refreshStart } from './store/authStore'
import './index.css'

const prepareApp = async () => {
  // Sentry initiaization at the top level of application.
  if (config.sentry.dsn && config.sentry.tracingOrigins && config.sentry.tracesSampleRate) {
    Sentry.init({
      dsn: config.sentry.dsn,
      integrations: [
        new Integrations.BrowserTracing({
          tracingOrigins: config.sentry.tracingOrigins,
        }),
      ],
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: config.sentry.tracesSampleRate,
    })
    Sentry.setTag('Country', config.aspectApi)
  }

  // get new access token
  await refreshStart()

  return Promise.resolve()
}

const renderApp = () => render(<AppWrapper />, document.getElementById('app'))

const AppWrapper = () => (
  <AllProviders>
    <App />
  </AllProviders>
)

prepareApp().then(renderApp)

if (import.meta.hot) {
  import.meta.hot.accept('./App', renderApp)
}
