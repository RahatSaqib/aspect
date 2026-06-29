const fs = require('fs')
const path = require('path')
const { assert } = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

describe('downloadReport', () => {
  const testFilePath = path.join('/tmp', 'report-download-log-test.xlsx')

  afterEach(async () => {
    try {
      await fs.promises.unlink(testFilePath)
    } catch (error) {
      // ignore missing file
    }
  })

  it('inserts a log before generation and updates it after the file is written', async () => {
    const startStub = sinon.stub().resolves(99)
    const finishStub = sinon.stub().resolves()
    const getUserFromCredentialsStub = sinon.stub().resolves({ id: 7, name: 'admin' })
    const testContent = Buffer.from('report content for logging test')
    await fs.promises.writeFile(testFilePath, testContent)

    const saveReportToFileStub = sinon.stub().resolves({
      fileName: 'report-download-log-test.xlsx',
      extension: 'xlsx',
      promise: Promise.resolve({
        fullPath: testFilePath,
        dataQueryTimeSeconds: 3,
        fileGenerationTimeSeconds: 5,
      }),
    })

    const respondFileStub = sinon.stub().returns('file-response')

    const downloadReport = proxyquire('../../src/report/downloadReport', {
      '../auth/constraints': { getUserFromCredentials: getUserFromCredentialsStub },
      './saveReportToFile': { saveReportToFile: saveReportToFileStub },
      './reportDownloadLog': {
        startReportDownloadLog: startStub,
        finishReportDownloadLogInBackground: finishStub,
      },
      '../shared/response': { respondFile: respondFileStub },
    })

    const reply = {}
    const request = {
      auth: { credentials: { name: 'admin' } },
      query: { format: 'xlsx', minDate: '2024-01-01' },
      params: { externalId: 'all_results' },
    }

    const result = await downloadReport(request, reply)

    assert.equal(result, 'file-response')
    sinon.assert.calledOnce(getUserFromCredentialsStub)
    sinon.assert.calledOnce(startStub)
    sinon.assert.calledWith(startStub, {
      userId: 7,
      reportExternalId: 'all_results',
      format: 'xlsx',
      query: request.query,
      source: 'sync',
    })
    sinon.assert.calledOnce(saveReportToFileStub)
    sinon.assert.calledOnce(finishStub)
    sinon.assert.calledWith(
      finishStub,
      99,
      sinon.match({
        success: 1,
        dataQueryTimeSeconds: 3,
        fileGenerationTimeSeconds: 5,
        fileSizeBytes: testContent.length,
      })
    )
  })

  it('updates the log with an error when report generation fails', async () => {
    const startStub = sinon.stub().resolves(100)
    const finishStub = sinon.stub().resolves()
    const getUserFromCredentialsStub = sinon.stub().resolves({ id: 7, name: 'admin' })
    const saveReportToFileStub = sinon.stub().rejects(new Error('generation failed'))

    const downloadReport = proxyquire('../../src/report/downloadReport', {
      '../auth/constraints': { getUserFromCredentials: getUserFromCredentialsStub },
      './saveReportToFile': { saveReportToFile: saveReportToFileStub },
      './reportDownloadLog': {
        startReportDownloadLog: startStub,
        finishReportDownloadLogInBackground: finishStub,
      },
      '../shared/response': { respondFile: sinon.stub() },
    })

    try {
      await downloadReport(
        {
          auth: { credentials: { name: 'admin' } },
          query: { format: 'xlsx' },
          params: { externalId: 'all_results' },
        },
        {}
      )
      assert.fail('expected downloadReport to throw')
    } catch (error) {
      assert.equal(error.output.statusCode, 400)
    }

    sinon.assert.calledOnce(finishStub)
    sinon.assert.calledWith(
      finishStub,
      100,
      sinon.match({
        success: 0,
        errorMessage: 'generation failed',
      })
    )
  })

  it('still returns the report when logging fails', async () => {
    const startStub = sinon.stub().rejects(new Error('log insert failed'))
    const finishStub = sinon.stub().rejects(new Error('log update failed'))
    const getUserFromCredentialsStub = sinon.stub().resolves({ id: 7, name: 'admin' })
    const testContent = Buffer.from('report content')
    await fs.promises.writeFile(testFilePath, testContent)

    const saveReportToFileStub = sinon.stub().resolves({
      fileName: 'report-download-log-test.xlsx',
      extension: 'xlsx',
      promise: Promise.resolve({
        fullPath: testFilePath,
        dataQueryTimeSeconds: 1,
        fileGenerationTimeSeconds: 2,
      }),
    })

    const respondFileStub = sinon.stub().returns('file-response')

    const downloadReport = proxyquire('../../src/report/downloadReport', {
      '../auth/constraints': { getUserFromCredentials: getUserFromCredentialsStub },
      './saveReportToFile': { saveReportToFile: saveReportToFileStub },
      './reportDownloadLog': {
        startReportDownloadLog: startStub,
        finishReportDownloadLogInBackground: finishStub,
      },
      '../shared/response': { respondFile: respondFileStub },
    })

    const result = await downloadReport(
      {
        auth: { credentials: { name: 'admin' } },
        query: { format: 'xlsx' },
        params: { externalId: 'all_results' },
      },
      {}
    )

    assert.equal(result, 'file-response')
    sinon.assert.calledOnce(saveReportToFileStub)
    sinon.assert.calledOnce(respondFileStub)
  })
})
