const Joi = require('@hapi/joi')
const chai = require('chai')

const { downloadSitesRequestValidationV4 } = require('../../../src/mobileApi/site/listSites/validations')

const { assert } = chai

describe('mobileApi site listSites request validation (v4)', () => {
  const querySchema = Joi.object(downloadSitesRequestValidationV4().query)

  it('should accept nameContains with three or more characters', () => {
    const { error } = querySchema.validate({ nameContains: 'Day' })
    assert.isUndefined(error)
  })

  it('should reject nameContains with one or two characters', () => {
    const { error: err1 } = querySchema.validate({ nameContains: 'ab' })
    assert.isDefined(err1)

    const { error: err2 } = querySchema.validate({ nameContains: 'a' })
    assert.isDefined(err2)
  })

  it('should accept empty nameContains', () => {
    const { error } = querySchema.validate({ nameContains: '' })
    assert.isUndefined(error)
  })

  it('should trim nameContains before length check', () => {
    const { error } = querySchema.validate({ nameContains: '  abc  ' })
    assert.isUndefined(error)
  })

  it('should accept valid ISO modifiedSince', () => {
    const { error, value } = querySchema.validate({ modifiedSince: '2025-01-15T00:00:00.000Z' })
    assert.isUndefined(error)
    assert.instanceOf(value.modifiedSince, Date)
  })

  it('should accept null and empty modifiedSince', () => {
    assert.isUndefined(querySchema.validate({ modifiedSince: null }).error)
    assert.isUndefined(querySchema.validate({ modifiedSince: '' }).error)
  })

  it('should reject non-ISO modifiedSince', () => {
    const { error } = querySchema.validate({ modifiedSince: 'not-a-date' })
    assert.isDefined(error)
  })
})
