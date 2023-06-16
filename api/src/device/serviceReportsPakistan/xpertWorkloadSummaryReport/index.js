const { getConstraints } = require('../../../auth/constraints')
const {
  getXpertWorkloadSummaryReportByDevice,
  getXpertWorkloadSummaryReportByDistrict,
} = require('./xpertWorkloadSummaryReport')

async function xpertWorkloadSummaryReportByDevice(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { data, dynamicColumns } = await getXpertWorkloadSummaryReportByDevice(dataConstraints, query, [
    'r.deviceId',
    'r.assayId',
  ])
  return {
    ok: true,
    data,
    dynamicColumns,
  }
}

async function xpertWorkloadSummaryReportByDistrict(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { data, dynamicColumns } = await getXpertWorkloadSummaryReportByDistrict(dataConstraints, query)
  return {
    ok: true,
    data,
    dynamicColumns,
  }
}

module.exports = {
  xpertWorkloadSummaryReportByDevice,
  xpertWorkloadSummaryReportByDistrict,
}
