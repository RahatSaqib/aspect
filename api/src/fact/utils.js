function excludeResultsIfNeeded(queryBuilder, modifyToExcludeTests) {
  if (modifyToExcludeTests) {
    modifyToExcludeTests(queryBuilder, null, {
      result: 'r',
      displayResult: 'actual',
    })
  }
}

module.exports = {
  excludeResultsIfNeeded,
}
