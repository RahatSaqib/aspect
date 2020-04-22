const { getCases: _getCases } = require('./service')

async function getCases(request) {
  const { query, auth } = request
  const result = await _getCases(query, auth)
  return result
}

module.exports = {
  getCases,
}
