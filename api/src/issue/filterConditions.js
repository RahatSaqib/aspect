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

module.exports = {
  filterModuleDisabledIssue: filterByModuleSerial,
  filterByModuleSerial,
}
