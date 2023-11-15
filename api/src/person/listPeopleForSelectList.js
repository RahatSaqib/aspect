const { listPeople } = require('./common/db')

async function listPeopleForSelectList(request) {
  request.query.size = 'all'
  request.query.onlyUsersNotDisabled = true
  const response = await listPeople(request)
  return response
}

module.exports = {
  listPeopleForSelectList,
}
