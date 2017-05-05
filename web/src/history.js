import createBrowserHistory from 'history/createBrowserHistory'
import PiwikReactRouter from 'piwik-react-router'

import config from './config'

let history = createBrowserHistory() // eslint-disable-line import/no-mutable-exports

if (config.piwik) {
// set up analytics
  history = PiwikReactRouter({ // eslint-disable-line new-cap
    url: config.piwik.url,
    siteId: config.piwik.siteId
  }).connectToHistory(history)
}

export default history
