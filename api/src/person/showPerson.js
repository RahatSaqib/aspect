const { showPerson: showPersonBase } = require('./common/db')

async function showPerson(request) {
  return showPersonBase(request)
}

module.exports = {
  showPerson,
}
