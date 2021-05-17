const addTransferredQuery = (
  queryBuilder,
  knex,
  resultStatusTransferId,
  { minDate, maxDate }
) => {
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
        .on(
          's.id',
          knex.raw(
            `CAST(IFNULL(rslogTransferred.data ->> '$.previousReportableSiteId', 0) as UNSIGNED)`
          )
        )
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
        queryBuilder.andOn(
          'resultTransferred.endedOn',
          '>=',
          knex.raw('?', [minDate])
        )
      }
      if (maxDate) {
        queryBuilder.andOn(
          'resultTransferred.endedOn',
          '<=',
          knex.raw('?', [maxDate])
        )
      }
    })
    /**
     * for counting only rcaTransferred.requiresTreatment = 1
     */
    .leftOuterJoin('ResultCategoryAssay as rcaTransferred', builder => {
      builder
        .on('resultTransferred.assayId', 'rcaTransferred.assayId')
        .andOn(function () {
          this.on(
            'resultTransferred.resultCategory1',
            'rcaTransferred.resultCategoryId'
          ).orOn(
            'resultTransferred.resultCategory2',
            'rcaTransferred.resultCategoryId'
          )
        })
    })
    /**
     * for counting only delivered transferred results
     */
    .leftOuterJoin(
      'ResultDownloadLog as rdlTransferred',
      'rdlTransferred.resultId',
      'resultTransferred.id'
    )
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

module.exports = {
  addTransferredQuery,
}
