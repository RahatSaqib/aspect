const chai = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

const { assert } = chai

describe('formData showFormDataEntry', () => {
  let getConstraintsStub
  let buildBaseQueryStub
  let parseRowStub
  let enrichWithFormFieldsStub
  let qb
  let foundRow
  let showFormDataEntry

  const buildRequest = ({ params = {} } = {}) => ({
    params,
    auth: { credentials: { name: 'client-user' } },
  })

  const makeQb = () => {
    const stub = {}
    stub.where = sinon.stub().returns(stub)
    stub.first = sinon.stub().callsFake(() => Promise.resolve(foundRow))
    return stub
  }

  beforeEach(() => {
    foundRow = null
    getConstraintsStub = sinon.stub().resolves({ partner: { id: 91 } })
    parseRowStub = sinon.stub().callsFake(row => ({ ...row, parsed: true }))
    enrichWithFormFieldsStub = sinon.stub().callsFake(async row => ({ ...row, formFields: [] }))

    qb = makeQb()
    buildBaseQueryStub = sinon.stub().returns(qb)
    ;({ showFormDataEntry } = proxyquire('../../src/formData/showFormDataEntry', {
      '../auth/constraints': { getConstraints: getConstraintsStub },
      './db': { buildBaseQuery: buildBaseQueryStub },
      './formFieldsService': { parseRow: parseRowStub, enrichWithFormFields: enrichWithFormFieldsStub },
    }))
  })

  afterEach(() => {
    sinon.restore()
  })

  it('returns the parsed, enriched row for a found entry', async () => {
    foundRow = { id: 5, siteName: 'Site A' }

    const response = await showFormDataEntry(buildRequest({ params: { id: 5 } }))

    sinon.assert.calledWithExactly(qb.where, 'fd.id', 5)
    assert.isTrue(response.ok)
    assert.equal(response.data.id, 5)
    assert.deepEqual(response.data.formFields, [])
    sinon.assert.calledOnce(parseRowStub)
    sinon.assert.calledOnce(enrichWithFormFieldsStub)
    assert.equal(enrichWithFormFieldsStub.firstCall.args[1], 91)
  })

  it('throws a 404 Boom error when the entry does not exist', async () => {
    foundRow = null

    try {
      await showFormDataEntry(buildRequest({ params: { id: 999 } }))
      assert.fail('Expected Boom.notFound error')
    } catch (error) {
      assert.equal(error.output.statusCode, 404)
      assert.equal(error.message, 'FormData entry not found.')
    }
  })
})
