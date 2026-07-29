module.exports = require('../utils').seed(seed, __filename)
const _ = require('lodash')
const Promise = require('bluebird')

const { upsertCovidDeviceTypes } = require('../commonCovid')
const { deviceApprovalToId } = require('../../src/shared/dictionary')
const { insertDeviceWithGeneratedName } = require('../common/insertDeviceWithGeneratedName')

const now = new Date()
async function seed(knex) {
  const { partnerId, labSiteId } = await knex('Partner as p')
    .join('Device as d', 'p.id', 'd.partnerId')
    .join('Site as s', 's.id', 'd.siteId')
    .join('Geography as g', 's.geographyId', 's.geographyId')
    .join('Country as c', 'g.countryId', 'c.id')
    .where('p.name', 'Partner One')
    .andWhere('c.abbreviation', 'US')
    .first('d.partnerId', 'd.siteId as labSiteId', 's.name as labName', 's.externalId as labExternalId', 'g.countryId')

  const { id: adminId } = await knex('User').where({ name: 'admin' }).first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const covidDeviceTypes = (await upsertCovidDeviceTypes(knex)).filter(deviceType => deviceType.externalId !== 'Aspect')
  const deviceTypeAssays = {}
  await Promise.each(
    covidDeviceTypes.map(deviceType => deviceType.id),
    async deviceTypeId => {
      deviceTypeAssays[deviceTypeId] = await knex('Assay as a')
        .join('AssayType as at', 'a.assayTypeId', 'at.id')
        .where('a.deviceTypeId', deviceTypeId)
        .andWhere('at.externalId', 'covid19')
        .first('a.*')
    }
  )
  const deviceApprovalApprovedId = await deviceApprovalToId('approved')
  await Promise.each(covidDeviceTypes, async covidDeviceType => {
    let device = await knex('Device')
      .where({
        deviceTypeId: covidDeviceType.id,
        siteId: labSiteId,
        deviceApprovalId: deviceApprovalApprovedId,
      })
      .first('id')
    if (!device) {
      const { id: deviceId } = await insertDeviceWithGeneratedName(knex, {
        ...auditFields,
        deviceTypeId: covidDeviceType.id,
        deviceApprovalId: deviceApprovalApprovedId,
        partnerId,
        siteId: labSiteId,
        defaultReportableSiteId: labSiteId,
        lastPingOn: new Date(+now),
        lastSeenOn: new Date(+now),
        hostId: _.times(8, () => String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))).join(''),
        serial: _.times(24, () => String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))).join(''),
      })
      device = { id: deviceId }
    }

    const deployment = await knex('Deployment').where({ deviceId: device.id }).first('id')
    if (!deployment) {
      await knex('Deployment').insert({
        ...auditFields,
        deviceId: device.id,
        siteId: labSiteId,
        start: null,
        end: null,
      })
    }
  })
}
