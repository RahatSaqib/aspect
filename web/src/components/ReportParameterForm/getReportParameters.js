// Single accessor for a report's declared parameters. Seeds guarantee a non-empty
// array on every fixture report, so this only guards against a report object that
// has not loaded yet.
export const getReportParameters = report => report?.parameters ?? []
