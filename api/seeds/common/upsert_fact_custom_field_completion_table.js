const { startOfToday, addDays, format } = require('date-fns')
const { factFillCustomFieldsCompletionStats } = require('../../src/fact/customFieldsCompletionStatsService.js')

module.exports = async knex => {
  const result = await knex('Result').orderBy('endedOn', 'asc').first()

  const minDate = result ? result.endedOn : startOfToday()

  await factFillCustomFieldsCompletionStats(
    format(addDays(minDate, -30), 'yyyy-MM-dd'),
    format(addDays(startOfToday(), 1), 'yyyy-MM-dd')
  )
}
