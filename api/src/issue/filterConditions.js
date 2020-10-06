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
  filterModuleDisabledIssue: filterByModuleSerial,
  filterByModuleSerial,
  filterByLotAndAssay,
}
