module.exports = require('../utils').seed(seed, __filename)
const upsertContacts = require('../common/upsert_contacts')
const partnerData = require('./fixtures/partnerData')

async function seed(knex) {
  const contacts = [
    {
      personName: 'Nasiba Alimatova',
      timezone: 'Pakistan Standard Time',
      personEmailAddress: 'Nasiba_Alimatova@abtassoc.com',
      jobFunctions: ['Admin'],
      username: 'Nasiba_Alimatova@abtassoc.com',
      password: 'z6YFochc',
    },
    {
      personName: 'Anvar Giyasov',
      timezone: 'Pakistan Standard Time',
      personEmailAddress: 'Anvar_Giyasov@abtassoc.com',
      jobFunctions: ['Admin'],
      username: 'Anvar_Giyasov@abtassoc.com',
      password: 'VFW2oDxp',
    },
    {
      personName: 'Zarina Mussaeva',
      timezone: 'Pakistan Standard Time',
      personEmailAddress: 'Zarina_Mussaeva@abtassoc.com',
      jobFunctions: ['Admin'],
      username: 'Zarina_Mussaeva@abtassoc.com',
      password: 'ouiwyA1u',
    },
    {
      personName: 'Nadzeya Kramko',
      timezone: 'Pakistan Standard Time',
      personEmailAddress: 'n.kramko@imlred.de',
      jobFunctions: ['Admin'],
      username: 'n.kramko@imlred.de',
      password: '0pOBPdBs',
    },
    {
      personName: 'Uladzimir Antonenka',
      timezone: 'Pakistan Standard Time',
      personEmailAddress: 'u.antonenka@imlred.de',
      jobFunctions: ['Admin'],
      username: 'u.antonenka@imlred.de',
      password: '50cTfGhz',
    },
  ]
  await upsertContacts(
    knex,
    {
      adminUserName: partnerData.adminName,
      partnerName: partnerData.partnerName,
      partnerAbbreviation: 'US',
    },
    contacts
  )
}
