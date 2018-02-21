async function getLastResult(knex, deviceId) {
  const resultDetails = await knex('DeviceLog as dl')
    .join('Result as r', 'dl.resultId', 'r.id')
    .leftJoin(
      'ResultWorkflowStatus as rws',
      'r.resultWorkflowStatusId',
      'rws.id'
    )
    .leftJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('ResultSource as rs', 'r.resultSourceId', 'rs.id')
    .leftJoin('ResultType as rt', 'r.resultTypeId', 'rt.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .leftJoin('SampleType as st', 's.sampleTypeId', 'st.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .where('dl.deviceId', deviceId)
    .orderBy('dl.id', 'desc')
    .first(
      'r.id',
      'r.externalId',
      'r.deviceId',
      'r.siteId',
      'r.geographyId',
      'a.externalId as assay',
      'rws.externalId as resultWorkflowStatus',
      'rs.externalId as resultSource',
      'rt.externalId as resultType',
      'rc1.externalId as resultCategory1',
      'rc2.externalId as resultCategory2',
      's.externalId as sampleId',
      's.collectedOn as sampleCollectedOn',
      's.originSiteId as sampleOriginSiteId',
      'st.externalId as sampleTypeId',
      'r.resultData',
      'r.assayVersion',
      'r.startedOn',
      'r.endedOn',
      'r.consumableSerial',
      'r.consumableExpirationDate',
      'r.consumableLot',
      'r.instrumentSerial',
      'r.moduleName',
      'r.moduleSerial',
      'r.patientData',
      'r.senderVersion',
      'r.senderOperator',
      'r.notes',
      'r.errorCode'
    )
  if (resultDetails) {
    resultDetails.patientData = JSON.parse(resultDetails.patientData)
    resultDetails.resultData = JSON.parse(resultDetails.resultData)
  }
  return resultDetails
}

module.exports = {
  getLastResult,
}
