const logger = require('../shared/logger')
const { recordResultModule } = require('./recordResultModule')

/**
 * RESULT_LOGGED subscriber that maintains the InstrumentModule projection.
 *
 * Runs post-commit in its own connection (messageContext.run), so the Result row is
 * already visible and a failure here cannot roll back result ingestion. All result
 * sources (deviceApi processResultPayload + raw processors) dispatch RESULT_LOGGED,
 * so this covers every code path that creates a result.
 */
async function onResultLogged({ resultId }, { messageContext }) {
  if (!resultId) {
    return
  }
  return messageContext.run(async knex => {
    try {
      // Join Instrument to resolve instrumentId from (deviceId, instrumentSerial).
      // Results without an instrumentSerial or moduleName are not GeneXpert results
      // and will be ignored inside recordResultModule.
      const result = await knex('Result as r')
        .leftJoin('Instrument as i', function () {
          this.on('i.deviceId', 'r.deviceId').andOn('i.serial', 'r.instrumentSerial')
        })
        .where('r.id', resultId)
        .first('i.id as instrumentId', knex.raw('TRIM(r.moduleName) as moduleName'), 'r.moduleSerial', 'r.endedOn')

      if (!result) {
        return
      }

      await recordResultModule(knex, result)
    } catch (err) {
      // Projection is a cache: log and move on. The idempotent rebuild reconciles drift.
      logger.error(`instrumentModule projection failed for resultId:${resultId}`, {
        err,
        reLabel: 'instrumentModule:onResultLogged',
      })
    }
  })
}

module.exports = { onResultLogged }
