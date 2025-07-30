const { assert } = require('chai')
const { extractSampleId } = require('../../../src/plugin/deviceType/extractSampleId')

describe('extractSampleId - Default Implementation', () => {
  it('should extract sampleId from result.sample.id when valid', () => {
    const result = {
      sample: {
        id: '123-456789-123',
      },
      data: {
        patientId: '123-999999-123',
      },
      notes: 'do not parse this 444-555666-777, better from sample.id',
    }
    assert.equal(extractSampleId(result), '123-456789-123')
  })

  it('should extract sampleId from result.data.sampleId when valid', () => {
    const result = {
      data: {
        sampleId: '123-456789-123',
        patientId: '123-998899-123',
      },
      notes: 'do not parse this 444-555666-777, better from sample.id',
    }
    assert.equal(extractSampleId(result), '123-456789-123')
  })

  it('should extract sample ID from result.data.patientId when valid', () => {
    const result = {
      sample: {
        id: '',
      },
      data: {
        patientId: '123-456789-123',
      },
      notes: 'do not parse this 444-555666-777, better from result.data.patient.id',
    }

    assert.equal(extractSampleId(result), '123-456789-123')
  })

  it('must return result.sample.id, even an invalid one, if there is not a valid one anywhere', () => {
    const result = {
      sample: {
        id: 'invalid-format',
      },
    }
    assert.equal(extractSampleId(result), 'invalid-format')
  })

  it('should extract sample ID from notes when is missing from sample and patient', () => {
    const result = {
      notes: 'Sample ID: 123-456789-123 was processed',
    }
    assert.equal(extractSampleId(result), '123-456789-123')
  })

  it('should extract sampleId from result.notes when sample is invalid', () => {
    const result = {
      sample: {
        id: 'invalid-format',
      },
      notes: 'Sample ID: 123-456789-123 was processed',
    }
    assert.equal(extractSampleId(result), '123-456789-123')
  })

  it('should return null when no valid sampleId is found', () => {
    const result = {
      notes: 'No sample ID in this note',
    }
    assert.isNull(extractSampleId(result))
  })

  it('should extract first valid sampleId when multiple are present in notes', () => {
    const result = {
      notes: 'Sample IDs: 123-456789-123 and 456-789123-456 were processed',
    }
    assert.equal(extractSampleId(result), '123-456789-123')
  })

  it('should extract sampleId from data.notes', () => {
    const result = {
      data: {
        notes: 'Sample IDs: 123-456789-123 and 456-789123-456 were processed',
      },
    }
    assert.equal(extractSampleId(result), '123-456789-123')
  })
})
