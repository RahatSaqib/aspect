const { seed } = require('../utils')

const transformFilterCondition = originalFilterCondition => {
  const filterCondition = { ...originalFilterCondition }

  if (filterCondition.jobFunctions) {
    filterCondition.jobFunctions = filterCondition.jobFunctions.map(jf => ({
      ...jf,
      jobFunctionId: Number(jf.jobFunctionId),
    }))
  }

  if (filterCondition.persons) {
    filterCondition.persons = filterCondition.persons.map(p => ({
      ...p,
      personId: Number(p.personId),
    }))
  }

  if (filterCondition.areaItems) {
    filterCondition.areaItems = filterCondition.areaItems.map(a => ({
      ...a,
      value: Number(a.value),
    }))
  }

  return filterCondition
}

module.exports = seed(async knex => {
  const notifications = await knex('NotificationType').whereNotNull('filterCondition').select('id', 'filterCondition')

  await knex.transaction(async trx => {
    for (const notification of notifications) {
      const filterCondition = JSON.parse(notification.filterCondition)

      // eslint-disable-next-line no-await-in-loop
      await trx('NotificationType')
        .update({ filterCondition: JSON.stringify(transformFilterCondition(filterCondition)) })
        .where('id', notification.id)
    }
  })
}, __filename)
