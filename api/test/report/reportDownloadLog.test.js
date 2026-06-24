const { assert } = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

describe('reportDownloadLog', () => {
  let insertStub
  let updateStub
  let whereStub
  let knexStub
  let loggerWarningStub
  let startReportDownloadLog
  let finishReportDownloadLog

  beforeEach(() => {
    insertStub = sinon.stub().resolves([42])
    updateStub = sinon.stub().resolves(1)
    whereStub = sinon.stub().returns({ update: updateStub })
    knexStub = sinon.stub()
    knexStub.withArgs('ReportDownloadLog').returns({
      insert: insertStub,
      where: whereStub,
    })
    loggerWarningStub = sinon.stub()
    ;({ startReportDownloadLog, finishReportDownloadLog } = proxyquire('../../src/report/reportDownloadLog', {
      '../db': { knex: knexStub },
      '../shared/logger': { warning: loggerWarningStub },
    }))
  })

  it('inserts an in-progress row', async () => {
    const query = { minDate: '2024-01-01', maxDate: '2024-01-31', format: 'xlsx' }
    const logId = await startReportDownloadLog({
      userName: 'admin',
      reportExternalId: 'all_results',
      format: 'xlsx',
      query,
      source: 'sync',
    })

    assert.equal(logId, 42)
    sinon.assert.calledOnce(insertStub)
    sinon.assert.calledWith(
      insertStub,
      sinon.match({
        userName: 'admin',
        reportExternalId: 'all_results',
        format: 'xlsx',
        query: JSON.stringify(query),
        source: 'sync',
        success: null,
        timeSpanDays: 30,
      })
    )
  })

  it('sets timeSpanDays to null when the query has no date range', async () => {
    await startReportDownloadLog({
      reportExternalId: 'all_results',
      format: 'xlsx',
      query: {},
      source: 'sync',
    })

    sinon.assert.calledWith(insertStub, sinon.match({ timeSpanDays: null }))
  })

  it('returns null and logs a warning when insert fails', async () => {
    insertStub.rejects(new Error('db down'))

    const logId = await startReportDownloadLog({
      reportExternalId: 'all_results',
      format: 'xlsx',
      query: {},
      source: 'sync',
    })

    assert.isNull(logId)
    sinon.assert.calledOnce(loggerWarningStub)
  })

  it('updates the row on success', async () => {
    await finishReportDownloadLog(42, {
      success: 1,
      generationTimeMs: 1200,
      totalTimeMs: 1500,
      fileSizeBytes: 4096,
    })

    sinon.assert.calledWith(whereStub, { id: 42 })
    sinon.assert.calledWith(
      updateStub,
      sinon.match({
        success: 1,
        generationTimeMs: 1200,
        totalTimeMs: 1500,
        fileSizeBytes: 4096,
        endedOn: sinon.match.date,
      })
    )
  })

  it('truncates long error messages on update', async () => {
    await finishReportDownloadLog(42, {
      success: 0,
      errorMessage: 'x'.repeat(3000),
    })

    sinon.assert.calledWith(
      updateStub,
      sinon.match({
        success: 0,
        errorMessage: 'x'.repeat(2048),
      })
    )
  })

  it('does not throw when finish is called without a log id', async () => {
    await finishReportDownloadLog(null, { success: 1 })
    sinon.assert.notCalled(updateStub)
  })
})
