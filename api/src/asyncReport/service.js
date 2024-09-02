const { getAllAsyncReportsForUser } = require('../shared/report')

const getAsyncReportRequest = async request => {
  const { query, auth } = request

  const reports = await getAllAsyncReportsForUser(query, auth.credentials.personId)
  return reports
}

module.exports = {
  getAsyncReportRequest,
}
