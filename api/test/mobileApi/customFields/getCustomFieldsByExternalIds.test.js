const chai = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

const { assert } = chai

function knexChain(firstResult) {
  const first = sinon.stub().resolves(firstResult)
  const where = sinon.stub().returns({ first })
  return { where, first }
}

describe('mobileApi customFields getCustomFieldsByExternalIds', () => {
  let getFormsStub
  let assayChain
  let deviceTypeChain
  let knexStub
  let getCustomFieldsByExternalIds

  beforeEach(() => {
    getFormsStub = sinon.stub()
    assayChain = knexChain({ id: 1 })
    deviceTypeChain = knexChain({ id: 2 })
    knexStub = sinon.stub()
    knexStub.withArgs('Assay').returns({ where: assayChain.where })
    knexStub.withArgs('DeviceType').returns({ where: deviceTypeChain.where })
    ;({ getCustomFieldsByExternalIds } = proxyquire('../../../src/mobileApi/customFields/service', {
      '../../db': { knex: knexStub },
      '../../forms/service': { getForms: getFormsStub },
    }))
  })

  afterEach(() => {
    sinon.restore()
  })

  it('throws badRequest when assay externalId is unknown', async () => {
    assayChain.first.resolves(null)

    try {
      await getCustomFieldsByExternalIds({
        query: { assay: 'nonexistentAssayXyz' },
        auth: { credentials: {} },
      })
      assert.fail('Expected Boom.badRequest')
    } catch (err) {
      assert.equal(err.output.statusCode, 400)
      assert.include(err.message, 'Unknown Assay externalId')
      assert.include(err.message, 'nonexistentAssayXyz')
    }
    assert.isTrue(getFormsStub.notCalled)
  })

  it('throws badRequest when deviceType externalId is unknown', async () => {
    deviceTypeChain.first.resolves(null)

    try {
      await getCustomFieldsByExternalIds({
        query: { deviceType: 'nonexistentDeviceTypeXyz' },
        auth: { credentials: {} },
      })
      assert.fail('Expected Boom.badRequest')
    } catch (err) {
      assert.equal(err.output.statusCode, 400)
      assert.include(err.message, 'Unknown Device Type externalId')
      assert.include(err.message, 'nonexistentDeviceTypeXyz')
    }
    assert.isTrue(getFormsStub.notCalled)
  })

  it('loads forms when assay and deviceType exist', async () => {
    getFormsStub.resolves({
      A: {
        formDefinitionExternalId: 'A',
        assayExternalId: 'GxHiv1Vl',
        diseaseExternalId: null,
        deviceTypeExternalId: 'GeneXpert',
        fields: [],
      },
    })

    const res = await getCustomFieldsByExternalIds({
      query: { assay: 'GxHiv1Vl', deviceType: 'GeneXpert' },
      auth: { credentials: {} },
    })

    assert.equal(res.ok, true)
    assert.isArray(res.data)
    assert.equal(res.data.length, 1)
    assert.equal(res.data[0].formDefinitionExternalId, 'A')
    assert.isTrue(getFormsStub.calledOnce)
    assert.isTrue(assayChain.where.calledWith('externalId', 'GxHiv1Vl'))
    assert.isTrue(deviceTypeChain.where.calledWith('externalId', 'GeneXpert'))
  })
})
