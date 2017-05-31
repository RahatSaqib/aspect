import createBrowserHistory from 'history/createBrowserHistory'
import piwikReactRouter from 'piwik-react-router'

import config from './config'

let history = createBrowserHistory() // eslint-disable-line import/no-mutable-exports

if (config.piwik) {
  // set up analytics
  history = piwikReactRouter({
    url: config.piwik.url,
    siteId: config.piwik.siteId,
  }).connectToHistory(history)
}

export default history
