const { baseGxAlertMigration } = require('../../common')
const geographyFromGxAlert = require('./fixtures/geography.json')
const jobFunctions = require('./fixtures/jobFunctions.json')

const { diseaseToId } = require('../../../src/shared/dictionary')

module.exports = async function (
  knex,
  partnerName,
  adminName,
  gxAlertDeviceApiKey,
  sitesFromGxAlert,
  contactsFromGxAlert,
  geneXpertAssayExternalIds,
  customFieldsFromGxAlert,
  diseaseExternalId
) {
  await baseGxAlertMigration(
    {
      admin: {
        name: adminName,
      },
      partner: {
        name: partnerName,
        serverUrl: 'https://lesotho.aspect.id',
      },
      geographyFromGxAlert,
      gxAlertDevice: {
        deviceApiKeyToken: gxAlertDeviceApiKey,
      },
      sitesFromGxAlert,
      jobFunctions,
      contactsFromGxAlert,
      geneXpertAssayExternalIds,
      customFieldsFromGxAlert,
    },
    knex
  )

  const { id: partnerId } = await knex('Partner')
    .where('name', partnerName)
    .first('id')
  const siteExternalIds = sitesFromGxAlert.map(site => site.externalId)
  const siteIds = await knex('Site')
    .whereIn('externalId', siteExternalIds)
    .pluck('id')
  await knex('Site').whereIn('id', siteIds).update('partnerId', partnerId)
  await knex('Device').whereIn('siteId', siteIds).update('partnerId', partnerId)
  await knex('Result').whereIn('siteId', siteIds).update('partnerId', partnerId)

  const diseaseId = await diseaseToId(diseaseExternalId)
  const personUsernames = contactsFromGxAlert
    .filter(contact => !!contact.username)
    .map(contact => contact.username)
  const personIds = await knex('User as u')
    .join('Person as p', 'u.id', 'p.userId')
    .whereIn('u.name', personUsernames)
    .pluck('p.id')
  await knex('Person')
    .whereIn('id', personIds)
    .update({ lastPartnerId: partnerId })
  const jobContextIds = await knex('JobFunction as jf')
    .join('Job as j', 'jf.id', 'j.jobFunctionId')
    .join('JobContext as jc', 'j.id', 'jc.jobId')
    .where('jf.partnerId', partnerId)
    .pluck('jc.id')
  await knex('JobContext').whereIn('id', jobContextIds).update({ diseaseId })
}
