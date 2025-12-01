const { assert } = require('chai')
const excel = require('exceljs')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()
const ExcelJS = require('exceljs')

describe('Excel Report Generation', () => {
  it('should generate a valid Excel workbook', async () => {
    const extension = 'xlsx'

    const userPlaceHolders = {
      email: 'ahernandez@systemone.id',
      cell: '+541151413792',
    }

    const userStub = {
      id: 1,
      name: 'admin',
      defaultTimezone: 'Eastern Standard Time',
      userName: 'Admin',
      culture: 'en-US',
      timezone: 'Eastern Standard Time',
      timezoneIANA: 'America/New_York',
      personTimezoneIANA: 'America/New_York',
      countryAbbreviation: 'US',
      phone: null,
      email: 'test@systemone.id',
      partnerId: 1,
    }

    const sheetDataStub = [
      {
        data: [
          {
            deviceName: 'Aarren NMRL & GeneXpert',
            moduleName: 'Module A',
            moduleSerial: '1000',
            dateLastIssue: '2023-11-29T00:48:20.400Z',
            totalTestsRun: 1,
            lastTestUploadedDate: '2024-02-20T22:47:15.000Z',
          },
        ],
        dynamicColumns: [],
        fixedColumns: [],
        sections: [],
        dataSelector: null,
        total: 1,
        defaultNoDataMessage: 'No data',
        populator: undefined,
        replacements: [
          {
            placeholder: '<countOfDistinctDisabledModules>',
            value: 1,
          },
        ],
      },
    ]

    const queryStub = {
      minDate: '2025-02-11T00:00:00.000-05:00',
      maxDate: '2025-03-13T23:59:59.999-04:00',
      format: 'xlsx',
      timeZone: 'America/Buenos_Aires',
    }

    const auth = {
      isAuthenticated: true,
      isAuthorized: true,
      isInjected: false,
      credentials: {
        scope: ['clientApi'],
        personId: 1,
        name: 'admin',
        jobFunctionNames: ['Admin'],
        permissions: ['account:edit'],
        hasToAcceptLicenseId: null,
        iat: 1741843298,
        exp: 1741846898,
        iss: 'https://www.aspect.id',
      },
      artifacts: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        decoded: {
          personId: 1,
          name: 'admin',
          jobFunctionNames: ['Admin'],
          permissions: ['account:edit'],
          hasToAcceptLicenseId: null,
          iat: 1741843298,
          exp: 1741846898,
          iss: 'https://www.aspect.id',
        },
      },
      strategy: 'clientApi',
      mode: 'required',
      error: null,
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6MSwibmFtZSI6ImFkbWluIiwiam9iRnVuY3Rpb25OYW1lcyI6WyJBZG1pbiJdLCJwZXJtaXNzaW9ucyI6WyJhY2NvdW50OmVkaXQiLCJhZG1pbjplZGl0IiwiYXNzYXk6dmlldyIsImJyb3dzZTp2aWV3IiwiY2FzZTplZGl0IiwiZGFzaGJvYXJkOmludmVudG9yeSIsImRhc2hib2FyZDpzdW1tYXJ5IiwiZGFzaGJvYXJkOnZpZXciLCJkZW1vOmVkaXQiLCJkZXZpY2U6YWRtaW4iLCJkZXZpY2VBcGlLZXk6ZWRpdCIsImludmVudG9yeTplZGl0IiwiaXNzdWU6ZWRpdCIsIm5vdGlmaWNhdGlvbjplZGl0Iiwib3BlcmF0aW9uYWxEYXRhOnZpZXciLCJwYXRpZW50OmVkaXQiLCJwZXJzb246ZWRpdCIsInJlcG9ydDp2aWV3IiwicmVwb3J0ZXI6ZWRpdCIsInJlc3VsdDplZGl0Iiwicm91dGVyOnZpZXciLCJzaXRlOmFkbWluIiwidGFzazp2aWV3IiwidGFza01lbnU6dmlldyIsInRyZWF0bWVudFN0YXR1czplZGl0Il0sImhhc1RvQWNjZXB0TGljZW5zZUlkIjpudWxsLCJpYXQiOjE3NDE4NDMyOTgsImV4cCI6MTc0MTg0Njg5OCwiaXNzIjoiaHR0cHM6Ly93d3cuYXNwZWN0LmlkIn0.gRFDLgGqJwAPTtMtoCnZHxYqKFd9YUWj1PSXNR4CZH8',
    }
    const getReportDetailsStub = sinon.stub().returns({
      name: "'Do Not Use' Modules",
      description:
        "A list of all GeneXpert device modules marked as 'do not use'. Includes device name, module serial.",
      i18nKey: 'doNotUseModulesReport',
      i18nKeyDescription: 'doNotUseModulesReport_Description',
      externalId: 'do_not_use_modules_report',
      fileName: 'DoNotUseModulesReport',
      availableForNotification: 1,
      exportCsv: false,
      sortOrder: 1,
      validations: [],
      sheets: [
        {
          sortOrder: 0,
          moduleName: 'device/serviceReports',
          functionName: 'getDoNotUseModulesReport',
          query: {
            avoidStreaming: true,
          },
        },
      ],
    })

    const { generateReport } = proxyquire('../../src/report/serviceReports', {
      '../../src/report/service': {
        getReportDetails: getReportDetailsStub,
      },
      './serviceReports': {
        getSheetData: sinon.stub().resolves({ sheetDataStub }),
      },
    })
    // async function streamToBuffer(reportStream) {
    //   assert.isTrue(reportStream instanceof Stream, 'stream should be a valid Stream')
    //   return new Promise((resolve, reject) => {
    //     const chunks = []
    //     reportStream.on('data', chunk => chunks.push(chunk))
    //     reportStream.on('end', () => resolve(Buffer.concat(chunks)))
    //     reportStream.on('error', reject)
    //   })
    // }

    async function loadWorkbookFromBuffer(buffer) {
      // Convert the PassThrough stream to a buffer (only if report is not avoiding streaming)
      // const buffer = await streamToBuffer(reportStream)
      assert.instanceOf(buffer, Buffer, 'dataBuffer should be an instance of Buffer')
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      return workbook
    }

    const { dataBuffer: reportStream } = await generateReport(
      'do_not_use_modules_report',
      queryStub,
      auth,
      userStub,
      userPlaceHolders,
      extension
    )

    // Load the workbook from the buffer
    const workbook = await loadWorkbookFromBuffer(reportStream)

    assert.isTrue(workbook instanceof excel.Workbook, 'Generated object is a workbook')

    const worksheet = workbook.getWorksheet(1)
    assert.isNotNull(worksheet, 'Worksheet should exist')

    const titleCell = worksheet.getCell('A1')
    assert.equal(titleCell, 'Disabled Modules', 'Header should match expected value')

    // const dataRow = worksheet.getRow
    // assert.equal(dataRow.getCell(1).value, 'Expected Data', 'Data should match expected value')
  })
})
