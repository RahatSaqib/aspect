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
  { assayId, reagentLot },
  aliases = { issue: 'i' }
) => {
  if (assayId && reagentLot)
    queryBuilder.whereRaw(
      `${aliases.issue}.data->>"$.assayId"=? and ${aliases.issue}.data->>"$.reagentLot"=?`,
      [assayId, reagentLot]
    )
  console.log('filterbylot and assay')
  return queryBuilder
}

module.exports = {
  filterModuleDisabledIssue: filterByModuleSerial,
  filterByModuleSerial,
  filterByLotAndAssay,
}
