const filterByModuleSerial = (
  queryBuilder,
  { moduleSerial },
  aliases = { issue: 'i' }
) => {
  if (moduleSerial)
    queryBuilder.whereRaw(`${aliases.issue}.data->>"$.moduleSerial"=?`, [
      moduleSerial,
    ])
  return queryBuilder
}
const filterByInstrumentSerial = (
  queryBuilder,
  { instrumentSerial },
  aliases = { issue: 'i' }
) => {
  if (instrumentSerial)
    queryBuilder.whereRaw(`${aliases.issue}.data->>"$.instrumentSerial"=?`, [
      instrumentSerial,
    ])
  return queryBuilder
}
const filterByInstrumentAndModuleSerial = (
  queryBuilder,
  { instrumentSerial, moduleSerial },
  aliases = { issue: 'i' }
) => {
  return filterByModuleSerial(
    filterByInstrumentSerial(queryBuilder, { instrumentSerial }, aliases),
    { moduleSerial },
    aliases
  )
}
const filterByLotAndAssay = (
  queryBuilder,
  { assayId, consumableLot },
  aliases = { issue: 'i' }
) => {
  if (assayId && consumableLot)
    queryBuilder.whereRaw(
      `${aliases.issue}.data->>"$.assayId"=? and ${aliases.issue}.data->>"$.consumableLot"=?`,
      [assayId, consumableLot]
    )
  return queryBuilder
}

module.exports = {
  filterByInstrumentSerial,
  filterByLotAndAssay,
  filterByModuleSerial,
  filterByInstrumentAndModuleSerial,
}
