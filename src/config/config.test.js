/*eslint-env node, mocha */
/*eslint no-console: 0*/
'use strict'

import config from 'config'
import expect from 'expect'

describe('appEnvConfigTests', () => {
  it('should load app config file depending on current --env', () => {
    expect(config.appEnv).toBe('test')
  })
})
