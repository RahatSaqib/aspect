import expect from 'expect'
import fetch from 'isomorphic-fetch'
import injectTapEventPlugin from 'react-tap-event-plugin'
import { jsdom } from 'jsdom'
/* eslint-disable no-var*/

injectTapEventPlugin()

process.env.NODE_ENV = 'test'

require.extensions['.css'] = function () {return null}
require.extensions['.scss'] = function () {return null}
require.extensions['.png'] = function () {return null}
require.extensions['.jpg'] = function () {return null}

global.expect = expect
global.fetch = fetch
global.document = jsdom('')
global.window = document.defaultView

global.navigator = {
  userAgent: 'node.js'
}
