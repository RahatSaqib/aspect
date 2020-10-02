const filterByModuleSerial = (
  queryBuilder,
  { moduleSerial },
  aliases = { issue: 'i' }
) => {
  console.log('filter by module serial')
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
