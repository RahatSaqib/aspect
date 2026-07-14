const { knex, filterParams, filterDateRangeParams } = require('../../db')
const { addConstraints, addPartnerQueryConstraints } = require('../../auth/constraints')
const {
  applyUndeployedDevicesResultFilter,
  getResultListConstraintOptions,
  getUndeployedDevicesPartnerQueryOptions,
  withUndeployedAwareGeographyFilters,
} = require('../common/undeployedDevicesFilter')

function getQueryForResultsListAndExport(query, dataConstraints) {
  const { assayId } = query
  const { displayResult, showUndeployedDevices, showDecommissionedDevices } = getResultListConstraintOptions(query)

  const resultQuery = getBaseResults()
    .leftJoin('Site as sirep', 'r.reportableSiteId', 'sirep.id')
    .leftJoin('Site as sdpn', 'sdpn.id', 'd.siteId')
    .leftJoin('Geography as gdpn', 'sdpn.geographyId', 'gdpn.id')
    .leftJoin('State as stdpn', 'stdpn.id', 'gdpn.stateId')

    .modify(queryBuilder => {
      if (query.onlyUnreconciled) {
        queryBuilder.whereNull('r.reconciliationDate')
      }
      if (query.consumableId)
        queryBuilder.join('InventoryLog as il', 'il.resultId', 'r.id').where('il.consumableId', query.consumableId)
      if (Array.isArray(assayId) && assayId.length > 0) {
        queryBuilder.whereIn('r.assayId', assayId)
      }
      if (query.reportableSiteId || query.reportableSiteName) {
        if (query.onlyEverTransferred) {
          if (query.reportableSiteId) {
            queryBuilder.whereRaw(
              `EXISTS (
                SELECT rslog_transfer.resultId
                FROM ResultStatusLog as rslog_transfer
                  INNER JOIN ResultStatus as rs_transfer ON rslog_transfer.resultStatusId = rs_transfer.id
                WHERE rslog_transfer.resultId = r.id
                  and rs_transfer.externalId = 'Transfer'
                  and CAST(IFNULL(rslog_transfer.data ->> '$.previousReportableSiteId', 0) as UNSIGNED) = ?
              )`,
              [query.reportableSiteId]
            )
          } else {
            queryBuilder.whereRaw(
              `EXISTS (
                SELECT rslog_transfer.resultId
                FROM ResultStatusLog as rslog_transfer
                  INNER JOIN ResultStatus as rs_transfer ON rslog_transfer.resultStatusId = rs_transfer.id
                WHERE rslog_transfer.resultId = r.id
                  and rs_transfer.externalId = 'Transfer'
                  and CAST(IFNULL(rslog_transfer.data ->> '$.previousReportableSiteId', 0) as UNSIGNED) IN (
                    SELECT s_transfer.id
                    FROM Site s_transfer
                    WHERE s_transfer.name LIKE ?
                  )
              )`,
              [`%${query.reportableSiteName}%`]
            )
          }
        } else if (query.reportableSiteId) {
          queryBuilder.where('sirep.id', query.reportableSiteId)
        } else {
          queryBuilder.whereRaw('sirep.name LIKE ?', [`%${query.reportableSiteName}%`])
        }
      }
    })
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .modify(
      filterParams,
      query,
      withUndeployedAwareGeographyFilters(
        {
          deviceId: 'd.id',
          resultCategoryId: 'r.resultCategory1',
          resultCategory2Id: 'r.resultCategory2',
          countryId: 'g.countryId',
          stateId: 'g.stateId',
          lgaId: 'g.lgaId',
          deviceName: 'd.name',
          deviceType: 'dt.externalId',
          siteName: 'si.name',
          sampleId: 'sp.externalId',
          sampleOriginSite: 'so.name',
          errorCode: 'r.errorCode',
          patientCaseId: null, // 'r.patientCaseId',
          diseaseId: 'disease_id',
          onlyReportableResults: 'r.resultCategoryAssay_reportable',
          resultCategoryGroupId: 'r.resultCategoryGroup_externalId',
          assayId: 'assayId',
        },
        query
      )
    )
    .modify((queryBuilder, params) => {
      if (params.onlyDownloadedByReporter) queryBuilder.innerJoin('ResultDownloadLog as rdl', 'r.id', 'rdl.resultId')

      if (params.onlyTreatmentRequired) {
        queryBuilder.andWhere(b => {
          b.where('r.resultCategory1Assay_requiresTreatment', true).orWhere(
            'r.resultCategory2Assay_requiresTreatment',
            true
          )
        })
      }

      if (params.patientOrResearchId) {
        queryBuilder.whereRaw('LOWER(r.patient_externalId) like LOWER(?)', [`%${params.patientOrResearchId}%`])
      }
    }, query)
    .modify(addPartnerQueryConstraints, dataConstraints, getUndeployedDevicesPartnerQueryOptions(query))
    .modify(queryBuilder => applyUndeployedDevicesResultFilter(queryBuilder, query))
    .modify(
      addConstraints,
      dataConstraints,
      {
        device: 'd',
        deviceType: 'dt',
        sample: 'sp',
        site: 'si',
        geography: 'g',
        result_read: 'r',
        country: 'c',
        // disease: 'dis',
      },
      { showUndeployedDevices, showDecommissionedDevices, displayResult }
    )
    .modify(queryBuilder => {
      if (query.withTags) {
        queryBuilder.leftJoin(
          knex('Tag as tag')
            .innerJoin('ResultTag as rtg', 'rtg.tagId', 'tag.id')
            .groupBy('rtg.resultId')
            .select('rtg.resultId', knex.raw('GROUP_CONCAT(DISTINCT tag.title  SEPARATOR ", ") as tagsCsv'))
            .as('tags'),
          'r.id',
          'tags.resultId'
        )
      }
    })

  return resultQuery
}

const getBaseResults = () =>
  knex(`Result_READ as r`)
    .leftJoin('Partner as p', 'r.partnerId', 'p.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .leftJoin('Geography as g', 'si.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('SampleType as stp', 'sp.sampleTypeId', 'stp.id')
    .leftJoin('Site as so', 'sp.originSiteId', 'so.id')

module.exports = { getQueryForResultsListAndExport }
