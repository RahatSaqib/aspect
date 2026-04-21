const chai = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

const { assert } = chai

const SERVICE_PATH = '../../../src/mobileApi/customFields/service'

function knexChain(firstResult) {
  const first = sinon.stub().resolves(firstResult)
  const where = sinon.stub().returns({ first })
  return { where, first }
}

describe('mobileApi customFields getCustomFieldsByExternalIds', () => {
  let getCustomFieldsStub
  let getConstraintsStub
  let deviceTypeChain
  let knexStub
  let getCustomFieldsByExternalIds

  beforeEach(() => {
    getCustomFieldsStub = sinon.stub().resolves({ fields: [] })
    getConstraintsStub = sinon.stub().resolves({
      country: { id: 10 },
      partner: { id: 20 },
    })
    deviceTypeChain = knexChain({ id: 2 })
    knexStub = sinon.stub()
    knexStub.withArgs('DeviceType').returns(deviceTypeChain)
    ;({ getCustomFieldsByExternalIds } = proxyquire(SERVICE_PATH, {
      '../../db': { knex: knexStub },
      '../../auth/constraints': { getConstraints: getConstraintsStub },
      '../../forms/service': { getCustomFields: getCustomFieldsStub },
    }))
  })

  afterEach(() => {
    sinon.restore()
  })

  it('throws badRequest when deviceType externalId is unknown', async () => {
    deviceTypeChain.first.resolves(undefined)

    let thrown
    try {
      await getCustomFieldsByExternalIds({
        query: { deviceType: 'nonexistentDeviceTypeXyz' },
        auth: { credentials: {} },
      })
    } catch (err) {
      thrown = err
    }

    assert.isOk(thrown, 'Expected Boom.badRequest to be thrown')
    assert.equal(thrown.output.statusCode, 400)
    assert.include(thrown.message, 'Unknown DeviceType.externalId')
    assert.include(thrown.message, 'nonexistentDeviceTypeXyz')
    assert.isTrue(getCustomFieldsStub.notCalled)
  })

  it('loads custom fields when deviceType exists and restricts field props', async () => {
    const fields = [
      {
        id: 1,
        name: 'foo',
        title: 'Foo',
        fieldType: 'text',
        order: 1,
        controlType: 'textBox',
        mandatory: true,
        validation: { required: true },
        condition: null,
        items: [],
        i18nKey: 'leakedKey',
        gxAlertDbColumn: 'leakedCol',
      },
    ]
    getCustomFieldsStub.resolves({ fields })

    const res = await getCustomFieldsByExternalIds({
      query: { deviceType: 'molbioTruenat' },
      auth: { credentials: { some: 'creds' } },
    })

    assert.equal(res.ok, true)
    assert.isArray(res.data)
    assert.equal(res.data.length, 1)
    assert.isArray(res.data[0].fields)
    assert.equal(res.data[0].fields.length, 1)
    assert.deepEqual(res.data[0].fields[0], {
      id: 1,
      name: 'foo',
      title: 'Foo',
      fieldType: 'text',
      order: 1,
      controlType: 'textBox',
      mandatory: true,
      validation: { required: true },
      condition: null,
      items: [],
    })
    assert.isTrue(deviceTypeChain.where.calledOnceWithExactly('externalId', 'molbioTruenat'))
    assert.isTrue(getCustomFieldsStub.calledOnceWithExactly(20, 2, 10))
  })

  it('skips DeviceType lookup when deviceType query param is absent', async () => {
    const res = await getCustomFieldsByExternalIds({
      query: {},
      auth: { credentials: {} },
    })

    assert.equal(res.ok, true)
    assert.isArray(res.data)
    assert.isTrue(knexStub.notCalled)
    assert.isTrue(getCustomFieldsStub.calledOnceWithExactly(20, null, 10))
  })
})
