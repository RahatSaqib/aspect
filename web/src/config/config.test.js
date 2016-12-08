/* eslint-env node, mocha */
/* eslint no-console: 0*/

import { expect } from 'chai'

describe('appEnvConfigTests', () => {
  it('should load app config file depending on current process.env.ASPECT_ENV', () => {
    expect(process.env.ASPECT_ENV).to.equal('test')
  })
})
