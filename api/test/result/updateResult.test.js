const chai = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

const { assert } = chai

describe('result updateResult', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('forbids custom field changes for molbioTruenat results', async () => {
    const getResultByResultIdStub = sinon.stub().resolves({
      ok: true,
      data: {
        id: 44,
        deviceId: null,
        resultDataHash: 'hash',
        customFields: [{ source: 'patientData.name', title: 'Name' }],
        patientData: { name: 'Original' },
        assay: { deviceTypeExternalId: 'molbioTruenat' },
      },
      resultTypeId: 2,
    })
    const getUserStub = sinon.stub().resolves({ id: 9 })
    const knexStub = sinon.stub()

    const { updateResult } = proxyquire('../../src/result/updateResult', {
      './common/db': { getResultByResultId: getResultByResultIdStub },
      '../auth/service': { getUser: getUserStub },
      '../db': { knex: knexStub },
      './actions': { resultReadyForNotification: sinon.stub() },
      '../shared/request': { getRemoteAddress: sinon.stub() },
      '../shared/dictionary': { resultTypeToId: sinon.stub() },
    })

    const res = await updateResult({
      params: { resultId: 44 },
      auth: { credentials: { name: 'u1' } },
      payload: { patientData: { name: 'Edited' } },
      plugins: { messageContext: { bindActionCreators: sinon.stub(), resultReadyForNotification: sinon.stub() } },
    })

    assert.equal(res.output.statusCode, 403)
    assert.equal(knexStub.callCount, 0)
  })

  it('allows unchanged custom field payload for molbioTruenat', async () => {
    const getResultByResultIdStub = sinon.stub().resolves({
      ok: true,
      data: {
        id: 44,
        deviceId: null,
        resultDataHash: 'hash',
        customFields: [{ source: 'patientData.name', title: 'Name' }],
        patientData: { name: 'Same' },
        assay: { deviceTypeExternalId: 'molbioTruenat' },
      },
      resultTypeId: 2,
    })
    const getUserStub = sinon.stub().resolves({ id: 9 })
    const update = sinon.stub().resolves(1)
    const knexStub = sinon.stub()
    knexStub.withArgs('Result').returns({ where: sinon.stub().returns({ update }) })

    const { updateResult } = proxyquire('../../src/result/updateResult', {
      './common/db': { getResultByResultId: getResultByResultIdStub },
      '../auth/service': { getUser: getUserStub },
      '../db': { knex: knexStub },
      './actions': { resultReadyForNotification: sinon.stub() },
      '../shared/request': { getRemoteAddress: sinon.stub() },
      '../shared/dictionary': { resultTypeToId: sinon.stub() },
    })

    const res = await updateResult({
      params: { resultId: 44 },
      auth: { credentials: { name: 'u1' } },
      payload: { patientData: { name: 'Same' } },
      plugins: { messageContext: { bindActionCreators: sinon.stub(), resultReadyForNotification: sinon.stub() } },
    })

    assert.deepEqual(res, { ok: true, data: { id: 44 } })
    assert.isTrue(update.calledOnce)
  })
})
