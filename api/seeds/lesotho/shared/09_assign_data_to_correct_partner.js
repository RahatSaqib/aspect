const _ = require('lodash')
const { baseGxAlertMigration } = require('../../common')
const geographyFromGxAlert = require('./fixtures/geography.json')
const jobFunctionsFixture = require('./fixtures/jobFunctions')
const { diseaseToId } = require('../../../src/shared/dictionary')

module.exports = async function (
  knex,
  sitesFromGxAlert,
  contactsFromGxAlert,
  geneXpertAssayExternalIds,
  customFieldsFromGxAlert,
  diseaseExternalId,
  partnerData
) {
  const { partnerName, adminUserName, gxAlertDeviceApiKey } = partnerData
  const { id: partnerId } = await knex('Partner').where('name', partnerName).first('id')
  const siteExternalIds = sitesFromGxAlert.map(site => site.externalId)
  const siteIds = await knex('Site').whereIn('externalId', siteExternalIds).pluck('id')
  await knex('Site').whereIn('id', siteIds).update('partnerId', partnerId)
  await knex('Device').whereIn('siteId', siteIds).update('partnerId', partnerId)
  await knex('Result').whereIn('siteId', siteIds).update('partnerId', partnerId)

  const diseaseId = await diseaseToId(diseaseExternalId)
  const personUsernames = _.uniq([
    ...contactsFromGxAlert.filter(contact => !!contact.username).map(contact => contact.username),
    adminUserName,
  ])
  const personIds = await knex('User as u')
    .join('Person as p', 'u.id', 'p.userId')
    .whereIn('u.name', personUsernames)
    .pluck('p.id')
  await knex('Person').whereIn('id', personIds).update({ partnerId, lastPartnerId: partnerId })
  const jobContextIds = await knex('JobFunction as jf')
    .join('Job as j', 'jf.id', 'j.jobFunctionId')
    .join('JobContext as jc', 'j.id', 'jc.jobId')
    .where('jf.partnerId', partnerId)
    .pluck('jc.id')
  await knex('JobContext').whereIn('id', jobContextIds).update({ diseaseId })
  await baseGxAlertMigration(
    {
      admin: {
        name: adminUserName,
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
      jobFunctionsFixture,
      contactsFromGxAlert,
      geneXpertAssayExternalIds,
      customFieldsFromGxAlert,
    },
    knex,
    partnerData
  )
}
