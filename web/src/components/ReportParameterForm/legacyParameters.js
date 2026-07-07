// Byte-identical mirror of LEGACY_REPORT_PARAMETERS in api/src/report/params.js.
// Drift is guarded by Tests/ReportParameterForm.test.jsx asserting the exact literal.
export const LEGACY_REPORT_PARAMETERS = [
  { name: 'dateRange', type: 'dateRange' },
  { name: 'stateId', type: 'state' },
  { name: 'lgaId', type: 'lga', dependsOn: 'stateId' },
  { name: 'assayId', type: 'assay', multiple: true },
  { name: 'consumableId', type: 'consumable' },
  { name: 'siteName', type: 'site', dependsOn: 'lgaId', permission: 'site:view' },
]

// Single accessor for a report's declared parameters. Reports whose `parameters`
// is undefined, null or [] (migration backfill / API not redeployed) degrade to
// the legacy set so dialogs never render empty. Never read report.parameters directly.
export const getReportParameters = report => (report?.parameters?.length ? report.parameters : LEGACY_REPORT_PARAMETERS)
