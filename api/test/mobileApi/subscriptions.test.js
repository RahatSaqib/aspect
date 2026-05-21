const chai = require('chai')

const { assert } = chai

describe('mobileApi subscriptions', () => {
  it('should subscribe FormData result-linking to Truenat result logged events only', () => {
    const { subscriptions } = require('../../src/mobileApi/subscriptions')
    const { types: resultActionTypes } = require('../../src/result/actions')
    const { onFormDataResultLogged } = require('../../src/mobileApi/customFields/linkFormDataOnResultLogged')

    assert.isArray(subscriptions)
    assert.isAtLeast(subscriptions.length, 1)
    assert.strictEqual(subscriptions[0].actions[resultActionTypes.TRUENAT_RESULT_LOGGED], onFormDataResultLogged)
    assert.isUndefined(subscriptions[0].actions.RESULT_LOGGED)
  })
})
