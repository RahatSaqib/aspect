const { savePerson } = require('./common/db')

async function updatePerson(request) {
  return savePerson(request, [
    'name',
    'title',
    'email',
    'email2',
    'phone',
    'phoneE164',
    'cell',
    'cellE164',
    'culture',
    'countryId',
    'stateId',
    'lgaId',
    'zip',
    'notes',
    'lastPartnerId',
    'timezone',
    'tags',
    'canLogIn',
    'hidePatientId',
    'hideSampleId',
    'hideNotes',
  ])
}

module.exports = {
  updatePerson,
}
