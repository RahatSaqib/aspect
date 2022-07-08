const xdrDevicesSummary = {
  name: 'Summary table for XDR devices',
  description:
    'Lists sites/devices grouped by province showing main XDR parameters',
  i18nKey: 'xdrDevicesSummary',
  externalId: 'xdr_devices_summary', // folder name in /templates
  i18nKeyDescription: 'xdrDevicesSummaryDescription',
  fileName: 'XdrDevicesSummary',
  exportCsv: false,
  sortOrder: 101,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReportPakistan',
      functionName: 'getReportXdrDevicesSummary',
      query: {
        avoidStreaming: true,
      },
    },
  ],
}

module.exports = {
  xdrDevicesSummary,
}
