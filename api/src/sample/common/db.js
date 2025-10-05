const getSampleByExternalId = (knex, externalId, countryId) => {
  // return knex('Sample').where('externalId', externalId).first()
  return knex('Sample as s')
    .join('Site as site', 's.originSiteId', 'site.id')
    .join('Geography as g', 'site.geographyId', 'g.id')
    .leftJoin('SampleType as st', 's.sampleTypeId', 'st.id')
    .where('s.externalId', externalId)
    .andWhere('s.registeredInMobile', true)
    .andWhere('g.countryId', countryId)
    .orderBy('s.collectedOn', 'desc')
    .select('s.id', 'st.externalId as sampleTypeExternalId', 's.collectedOn')
}

module.exports = {
  getSampleByExternalId,
}
