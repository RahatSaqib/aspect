// This is the entry point for our app
import 'whatwg-fetch'
import 'url-search-params-polyfill'
import noop from 'lodash/noop'
import { render } from 'react-dom'
import * as Sentry from '@sentry/react'
import { Integrations } from '@sentry/tracing'
import config from './config'
import store from './store/store'
import { hydrateFromLocalStorage, refreshStart } from './store/AuthRedux'
import './index.css'
import { getAspectHydrateData } from './globals/sideEffects/LocalStorage'
import appFactory from './globals/factories/appFactory'

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

// --- TODO: re-think below code after finishing upgrade
// // eslint-disable-next-line no-constant-condition
// if (process.env.NODE_ENV === 'development' && false) {
//   // TODO: workaround: https://github.com/garbles/why-did-you-update/issues/45
//   // eslint-disable-next-line no-unused-vars
//   let { createClass } = React
//   Object.defineProperty(React, 'createClass', {
//     set: nextCreateClass => {
//       createClass = nextCreateClass
//     },
//   })
//   const { whyDidYouUpdate } = require('why-did-you-update')
//   whyDidYouUpdate(React, {
//     exclude: new RegExp(
//       `^(${[
//         'Themed|Button|MenuItem|Overlay|ProgressBar|Layout|AppBar|Dialog',
//         'AutoLockScrolling|IconMenu|Router|Route|IconButton|ActivableRenderer',
//         'BeforeAfterWrapper|TextField|EnhancedButton|NavigationArrowDropDown',
//         'SvgIcon|TouchRipple|DropDownMenu|SelectField|AutoComplete|Card|Paper',
//       ].join('|')})`
//     ),
//   })
// }

const appDom = document.getElementById('app')

const renderApp = () => render(appFactory(noop)({ store }), appDom)

// let's see if we can get culture from local storage
store.dispatch(hydrateFromLocalStorage(getAspectHydrateData()))

// get new access token
store.dispatch(refreshStart()).then(renderApp, renderApp)

if (module.hot) {
  module.hot.accept('./globals/factories/appFactory', renderApp)
}
