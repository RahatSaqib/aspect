const addTransferredQuery = (queryBuilder, knex, resultStatusTransferId, { minDate, maxDate }) => {
  queryBuilder
    /**
     * for counting `transferred` results -
     * we join `Site.id` to `ResultStatusLog.data.previousReportableSiteId`
     * and count all 'ResultStatusLog.resultId' which have ResultStatus = 'Transfer'
     * See func `transferResult` in `api/src/result/service.js` for details
     * about what we store in field ResultStatusLog.data
     */
    .leftOuterJoin('ResultStatusLog as rslogTransferred', builder => {
      builder
        .on('s.id', knex.raw(`CAST(IFNULL(rslogTransferred.data ->> '$.previousReportableSiteId', 0) as UNSIGNED)`))
        // limit this join by `Transfer` result status only
        .andOn('rslogTransferred.resultStatusId', resultStatusTransferId)
    })
    /**
     * join ResultStatusLog and Result to limit transferred results
     * by date range - count resultTransferred.id for `transferred` results
     */
    .leftOuterJoin('Result as resultTransferred', queryBuilder => {
      queryBuilder.on('rslogTransferred.resultId', 'resultTransferred.id')
      if (minDate) {
        queryBuilder.andOn('resultTransferred.endedOn', '>=', knex.raw('?', [minDate]))
      }
      if (maxDate) {
        queryBuilder.andOn('resultTransferred.endedOn', '<=', knex.raw('?', [maxDate]))
      }
    })
    /**
     * for counting only rcaTransferred.requiresTreatment = 1
     */
    .leftOuterJoin('ResultCategoryAssay as rcaTransferred', queryBuilder => {
      queryBuilder.on('resultTransferred.assayId', 'rcaTransferred.assayId').andOn(qb => {
        qb.on('resultTransferred.resultCategory1', 'rcaTransferred.resultCategoryId').orOn(
          'resultTransferred.resultCategory2',
          'rcaTransferred.resultCategoryId'
        )
      })
    })
    /**
     * for counting only delivered transferred results
     */
    .leftOuterJoin('ResultDownloadLog as rdlTransferred', 'rdlTransferred.resultId', 'resultTransferred.id')
    .count({
      // see comment for joining table ResultStatusLog
      transferred: knex.raw(`DISTINCT
        CASE
          WHEN rcaTransferred.requiresTreatment = 1  AND  rcaTransferred.reportable = 1
          THEN rdlTransferred.resultId
          ELSE null
        END`),
    })
}

// --------------------------------------------------------------------
const addResultCountsQuery = (queryBuilder, knex, { withResultCategory2 = true } = {}) => {
  queryBuilder
    /**
     * join to ResultDownloadLog for counting results 'delivered' to Reporters
     */
    .leftOuterJoin('ResultDownloadLog as rdl', 'rdl.resultId', 'r.id')
    /**
     * for counting different statuses rts.externalId = 'XXX'
     */
    .leftOuterJoin('ResultTreatmentStatusLog as rtsl', 'rtsl.id', 'r.treatmentStatusLogId')
    .leftOuterJoin('ResultTreatmentStatus as rts', 'rts.id', 'rtsl.resultTreatmentStatusId')
    /**
     * for counting  rca.requiresTreatment = 1
     */
    .leftOuterJoin('ResultCategoryAssay as rca', builder => {
      builder.on('r.assayId', 'rca.assayId').andOn(qb => {
        qb.on('r.resultCategory1', 'rca.resultCategoryId')
        if (withResultCategory2 === true) {
          qb.orOn('r.resultCategory2', 'rca.resultCategoryId')
        }
      })
    })
    .count({
      totalResults: knex.raw(`DISTINCT
        CASE
          WHEN rca.reportable = 1
          THEN r.id ELSE null
        END`),
      delivered: knex.raw(`DISTINCT
        CASE
          WHEN rca.reportable = 1
          THEN  rdl.resultId ELSE null
        END`),
      /**
       * We should only be counting results that were delivered in the last four columns
       * because we're measuring how many of the results are linked to treatment on the
       * Reporter and they can't put results on treatment if they were never delivered
       * to the reporter.
       */
      requiresTreatment: knex.raw(`DISTINCT
        CASE
          WHEN rca.requiresTreatment = 1  AND  rca.reportable = 1  AND  r.reportableSiteId = s.id
          THEN rdl.resultId ELSE null
        END`),
      onTreatment: knex.raw(`DISTINCT
        CASE
          WHEN rca.requiresTreatment = 1  AND  rca.reportable = 1  AND  r.reportableSiteId = s.id  AND  rts.externalId = 'OnTreatment'
          THEN rdl.resultId ELSE null
        END`),
      notPossible: knex.raw(`DISTINCT
        CASE
          WHEN rca.requiresTreatment = 1  AND  rca.reportable = 1  AND  r.reportableSiteId = s.id  AND  rts.externalId = 'NotPossible'
          THEN rdl.resultId ELSE null
        END`),
      notOnTreatment: knex.raw(`DISTINCT
        CASE
          WHEN rca.requiresTreatment = 1  AND  rca.reportable = 1  AND  r.reportableSiteId = s.id  AND  (rts.externalId = 'AwaitingTreatment' OR rts.id is null)
          THEN rdl.resultId ELSE null
        END`),
    })
}

const whereWorkingDaysDateRange = (startedOn, endedOn) => {
  return builder => {
    builder
      .whereRaw('DATE(r.endedOn) between date(?) and date(?)', [startedOn, endedOn])
      .whereRaw('DAYOFWEEK(r.endedOn) not in (1,7)')
  }
}

const addResultCountsQueryExtended = (queryBuilder, knex, options) => {
  // Call the original function to set up the base query
  addResultCountsQuery(queryBuilder, knex, options)

  queryBuilder.clearSelect()

  // Modify the counts to remove r.reportableSiteId
  queryBuilder.count({
    totalResults: knex.raw(`DISTINCT
      CASE
        WHEN rca.reportable = 1
        THEN r.id ELSE null
      END`),
    onTreatment: knex.raw(`DISTINCT
      CASE
        WHEN rca.requiresTreatment = 1 AND  rts.externalId = 'OnTreatment'
        THEN r.id ELSE null
      END`),
    awaitingTreatment: knex.raw(`DISTINCT
      CASE
        WHEN rca.requiresTreatment = 1 AND (rts.externalId = 'AwaitingTreatment' OR rts.externalId IS NULL)
        THEN r.id ELSE NULL
      END`),
  })

  return queryBuilder
}

module.exports = {
  addResultCountsQuery,
  addTransferredQuery,
  whereWorkingDaysDateRange,
  addResultCountsQueryExtended,
}
