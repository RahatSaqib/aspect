const { addConstraints } = require('../../auth/constraints')
const querySelectors = require('./querySelectors')

/**
 *  Builds a knex query including all the necessary joins for scoping results to the data constraints
 * @param {*} knex
 * @param {*} dataConstraints
 */
const getBaseQuery = (knex, dataConstraints) =>
  knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .modify(addConstraints, dataConstraints, {
      result: 'r',
      geography: 'g',
      site: 'si',
    })

const modifiers = {
  join: {
    resultCategory1: queryBuilder => {
      queryBuilder.leftJoin(
        'ResultCategory as rc1',
        'r.resultCategory1',
        'rc1.id'
      )
    },
    resultCategory2: queryBuilder => {
      queryBuilder.leftJoin(
        'ResultCategory as rc2',
        'r.resultCategory2',
        'rc2.id'
      )
    },
    /**
     * Join the last result per module. Use to get module statuses.
     * @param {*} queryBuilder
     * @param {*} knex
     * @param {*} aliasMainResult - Alias of the main result table you want to join to
     */
    lastResultPerModule: (queryBuilder, knex, aliasMainResult = 'r') => {
      queryBuilder.join(
        knex('Result as r2')
          .groupBy('r2.deviceId', knex.raw('r2.resultData ->> "$.moduleName"'))
          .select('r2.deviceId')
          .max('r2.id as id')
          .as('rmax'),
        function () {
          this.on(`${aliasMainResult}.id`, 'rmax.id')
        }
      )
    },
  },
  where: {
    module: {
      /**
       * Excludes the results which module has been replaced
       * @param {*} queryBuilder
       */
      isActive: queryBuilder => {
        queryBuilder
          .leftJoin('Result as rLaterModuleSerial', joinQuery => {
            joinQuery
              .on('r.moduleName', 'rLaterModuleSerial.moduleName')
              .andOn('r.deviceId', 'rLaterModuleSerial.deviceId')
              .andOn('r.moduleSerial', '!=', 'rLaterModuleSerial.moduleSerial')
              .andOn('r.endedOn', '<', 'rLaterModuleSerial.endedOn')
          })
          .whereNull('rLaterModuleSerial.id')
      },
    },
  },
}

module.exports = {
  getBaseQuery,
  modifiers,
  ...querySelectors,
}
