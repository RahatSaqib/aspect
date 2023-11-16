const { savePerson } = require('./common/db')

async function updatePersonUserPreferences(request) {
  const response = await savePerson(request, ['timezone', 'culture'])
  return response
}

module.exports = {
  updatePersonUserPreferences,
}
