const { knex } = require('../../../db')
const { addConstraints } = require('../../../auth/constraints')

// get person detail by person's id
const getPersonDetailsById = (personId, dataConstraints) => {
  return knex('Person as p')
    .leftJoin('Geography as g', 'p.geographyId', 'g.id')
    .leftJoin('User as u', 'p.userId', 'u.id')
    .leftOuterJoin('State as s', 'g.stateId', 's.id')
    .leftOuterJoin('Country as c', 'g.countryId', 'c.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftOuterJoin('Job as j', 'p.id', 'j.personId')
    .modify(addConstraints, dataConstraints, { geography: 'g' })
    .where({ 'p.id': personId })
    .first(
      'p.id',
      'p.userId',
      'u.name as username',
      'p.name',
      'p.title',
      'p.email',
      'p.email2',
      'p.phone',
      'p.cell',
      'g.countryId',
      'g.id as geographyId',
      'g.stateId',
      'g.lgaId',
      'p.zip',
      'p.timezone',
      'p.culture',
      'p.notes',
      'p.lastPartnerId',
      'p.hidePatientId',
      'p.hideSampleId',
      'p.hideNotes',
      'c.name as country',
      's.name as stateName',
      'l.name as lgaName',
      'u.lockedOut as userLockedOut',
      'p.canLogIn',
      'p.disabled',
      'p.disabledOn',
      'j.id as jobId'
    )
}

// update person details
const updatePersonDetail = (personId, data) => {
  return knex('Person')
    .where({
      id: personId,
    })
    .update(data)
}

module.exports = { getPersonDetailsById, updatePersonDetail }
