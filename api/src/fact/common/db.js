function getBaseQueryForFactResultsDeviceByTimeFrame(
  knex,
  { addConstraints, dataConstraints, filterParams, assay, query },
  opts
) {
  const { showDecommissionedDevices = false, showUnapprovedDevices = false } = opts || {}
  return knex('FactResultsDeviceByTimeFrame as r')
    .innerJoin('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('Assay as a', 'a.id', 'r.assayId')
    .innerJoin('AssayType as at', 'at.id', 'a.assayTypeId')
    .innerJoin('ResultCategory as rc1', 'rc1.id', 'r.resultCategory1')
    .innerJoin('ResultCategoryAssay as rca', function () {
      this.on('r.assayId', 'rca.assayId').andOn('r.resultCategory1', 'rca.resultCategoryId')
    })
    .leftOuterJoin('ResultCategory as rc2', 'rc2.id', 'r.resultCategory2')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'st.id', 'g.stateId')
    .modify(
      addConstraints,
      dataConstraints,
      {
        assay: 'a',
        assayType: 'at',
        device: 'd',
        site: 's',
        geography: 'g',
      },
      { showDecommissionedDevices, showUnapprovedDevices }
    )
    .modify(filterParams, query, {
      assay: 'a.externalId',
      countryId: 'g.countryId',
      partnerId: 'g.partnerId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
      deviceName: 'd.name',
      deviceType: 'dt.externalId',
    })
    .modify(qb => {
      if (query.minDate) {
        qb.where('r.startedOn', '>=', query.minDate)
      }
      if (query.maxDate) {
        qb.where('r.startedOn', '<=', query.maxDate)
      }
      if (!query.assay && assay) {
        qb.whereIn('a.externalId', assay)
      }
      if (query.assayType) {
        qb.where('at.externalId', '=', query.assayType)
      }
      if (query.resultCategory1) {
        qb.where('rc1.externalId', '=', query.resultCategory1)
      }
      if (query.resultCategory2) {
        qb.where('rc2.externalId', '=', query.resultCategory2)
      }
    })
    .where('r.timeFrame', 'month')
    .sum('r.resultCount as cnt')
}

module.exports = {
  getBaseQueryForFactResultsDeviceByTimeFrame,
}
