import fetch from 'isomorphic-fetch'
import { jsdom } from 'jsdom'
/* eslint-disable no-var*/

process.env.NODE_ENV = 'test'

require.extensions['.css'] = function () {return null}
require.extensions['.png'] = function () {return null}
require.extensions['.jpg'] = function () {return null}

global.fetch = fetch
global.document = jsdom('')
global.window = document.defaultView

global.navigator = {
  userAgent: 'node.js'
}
