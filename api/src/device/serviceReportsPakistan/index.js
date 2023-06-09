const _ = require('lodash')
const { getConstraints } = require('../../auth/constraints')
const { getXpertSiteDetailedReport } = require('./xpertSiteDetailedReport')
const { getAllDeviceReportData } = require('../serviceReports/devicesAndSitesOverviewReport')
const { getResultCategoryGroupColumns } = require('../common/db')

async function xpertSiteDetailedReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { data, populator } = await getXpertSiteDetailedReport(dataConstraints, query)
  return {
    ok: true,
    data,
    populator,
  }
}

async function xpertSiteSummarySiteWiseReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const resultCategoryGroups = await getResultCategoryGroupColumns(dataConstraints, query)
  const { builder } = await getAllDeviceReportData(resultCategoryGroups, dataConstraints, query)
  const rows = await builder
    .leftJoin('Partner as pImpl', 'pImpl.id', 'd.implementingPartnerId')
    .select(['pImpl.name as implementingPartner'])

  /**
   * group by siteId - not by siteName because same site name may exist in
   * different geography locations
   */
  const bySiteId = _.reduce(
    rows,
    (acc, item) => {
      const { siteId, siteName, stateName, districtName, ...rest } = item
      acc[siteId] = acc[siteId] || {
        siteName,
        stateName,
        districtName,
        data: [],
      }
      acc[siteId].data = [...acc[siteId].data, rest]
      return acc
    },
    {}
  )

  /**
   * prepare array of dynamic columns to return and to use it below as well
   */
  const dynamicColumns = resultCategoryGroups.map(a => ({
    key: a.columnKey,
    header: a.columnName,
  }))

  /**
   * construct final list of sites and aggregate totals and  custom fields counts
   */
  const sites = _.reduce(
    _.keys(bySiteId),
    (acc, siteId) => {
      const { data, ...rest } = bySiteId[siteId]

      const dynamicColumnsValues = _.reduce(
        dynamicColumns,
        (acc, { key }) => {
          acc[key] = _.sumBy(data, key)
          return acc
        },
        {}
      )
      const { lastUploadOn } = _.maxBy(data, 'lastUploadOn') || {}
      /**
       * when different devices in the site use different implementingPartner's - assemble
       * final implementingPartner for the site
       */
      const implementingPartner = data
        .filter(x => x.implementingPartner)
        .map(x => x.implementingPartner)
        .join(', ')
      acc = [
        ...acc,
        {
          // few static columns with geography group names (site, province, district, etc)
          ...rest,
          implementingPartner,
          // few static columns with aggregations
          lastUploadOn,
          totalXpertTests: _.sumBy(data, 'totalXpertTests'),
          totalOtherTests: _.sumBy(data, 'totalOtherTests'),
          // all dynamic columns with aggregations
          ...dynamicColumnsValues,
        },
      ]
      return acc
    },
    []
  )

  return {
    ok: true,
    data: sites,
    total: sites.length,
    dynamicColumns,
  }
}

module.exports = {
  xpertSiteDetailedReport,
  xpertSiteSummarySiteWiseReport,
}
