const chai = require('chai')

const { assert } = chai
const { normalizePhoneNumber } = require('../../src/shared/phoneNormalization')

describe('This test is for normalizing the cellphone numbers for sending sms', () => {
  it('it should return a phone number depending on the country', async () => {
    assert.equal('+12345567893', normalizePhoneNumber('2345567893', 'US'))
    assert.equal('+541151545666', normalizePhoneNumber('1151545666', 'AR'))
    assert.equal('+12024561414', normalizePhoneNumber('202-456-1414', 'US'))
    assert.equal('+27119785313', normalizePhoneNumber('11 978 5313', 'ZA'))
    assert.equal('+23494617000', normalizePhoneNumber('94617000', 'NG'))
    assert.equal('+26594617000', normalizePhoneNumber('94617000', 'MW'))
    assert.equal('+9594617000', normalizePhoneNumber('94617000', 'MM'))
  })
})
