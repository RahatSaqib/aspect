/* eslint-disable import/no-dynamic-require */
const partnerData = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)

const seed = async knex => {
  const { adminUserName } = partnerData
  const { id: countryId } = await knex
    .first('c.id')
    .from('Person as p')
    .join('User as u', 'u.id', 'p.userId')
    .join('Geography as g', 'p.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .where('u.name', adminUserName)

  if (countryId) {
    await knex('Country').where('id', countryId).update('defaultTimeZone', partnerData.defaultCountryTimeZone)
  }
}

module.exports = require('../utils').seed(seed, __filename)
