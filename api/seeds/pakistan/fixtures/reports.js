const tbWorkloadSummary = {
  name: 'Report of TB Workload Summary',
  description:
    'Summary of TB Workload grouped by month, quarter and year for all provinces',
  i18nKey: 'reportTBWorkloadSummary',
  externalId: 'tb_workload_summary', // folder name in /templates
  i18nKeyDescription: 'reportTBWorkloadSummaryDescription',
  fileName: 'ReportTBWorkloadSummary',
  exportCsv: false,
  sortOrder: 13,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReportPakistan',
      functionName: 'getReportWorkloadSummary',
      query: {
        avoidStreaming: true,
        assay: ['GxMtbRif', 'GxMtbRifUltra'],
        groupBy: ['month', 'state', 'resultCategory1', 'resultCategory2'],
        minDate: '2019-01-01',
        nameOfSharedData: 'by-month',
      },
    },
    {
      sortOrder: 1,
      moduleName: 'result/serviceReportPakistan',
      functionName: 'getReportWorkloadSummaryByQuarter',
      query: {
        avoidStreaming: true,
        useNamedData: 'by-month',
      },
    },
    {
      sortOrder: 2,
      moduleName: 'result/serviceReportPakistan',
      functionName: 'getReportWorkloadSummaryByYear',
      query: {
        avoidStreaming: true,
        useNamedData: 'by-month',
      },
    },
  ],
}

module.exports = {
  tbWorkloadSummary,
}
