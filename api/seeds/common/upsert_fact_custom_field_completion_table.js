const { startOfToday, addDays, format } = require('date-fns')
const { factFillCustomFieldsCompletionStats } = require('../../src/fact/customFieldsCompletionStatsService.js')

module.exports = async knex => {
  const { endedOn: minDate } = await knex('Result').orderBy('endedOn', 'asc').first()
  await factFillCustomFieldsCompletionStats(
    format(addDays(minDate, -30), 'yyyy-MM-dd'),
    format(addDays(startOfToday(), 1), 'yyyy-MM-dd')
  )
}
