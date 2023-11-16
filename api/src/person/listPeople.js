const { listPeople: listPeopleBase } = require('./common/db')

async function listPeople(request) {
  const response = await listPeopleBase(request)
  return response
}

module.exports = {
  listPeople,
}
