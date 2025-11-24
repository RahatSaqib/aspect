const { listPeople: listPeopleQuery } = require('./common/db')

async function listPeople(request) {
  const response = await listPeopleQuery(request)
  return response
}

module.exports = {
  listPeople,
}
