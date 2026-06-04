module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const Promise = require('bluebird')

const { subMonths } = require('date-fns')
const { addCovidResults } = require('../commonGenerateResults')

const { getPartnerByExternalId } = require('../utils')

const { deviceTypeToId, deviceApprovalToId } = require('../../src/shared/dictionary')
const { insertDeviceWithGeneratedName } = require('../common/insertDeviceWithGeneratedName')

const resultMultiplier = process.env['seeds.resultMultiplier'] / 4 || 50
const now = new Date()

async function seed(knex) {
  const { id: adminId } = await knex('User').where({ name: 'admin' }).first('id')

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const { id: partnerId } = await getPartnerByExternalId(knex, 'partnerOne')

  const m2000DeviceTypeId = await deviceTypeToId('AbbottM2000')

  const deviceApprovalId = await deviceApprovalToId('approved')

  const sites = await knex('Site as s')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .where({ partnerId })
    .whereIn('c.a3', ['USA', 'NGA'])
    .select('s.*', 'c.a3')

  // Add an M2000DeviceForCovid to every 3rd lab in US and Nigeria
  const labSites = sites.filter((site, i) => site.name.indexOf('Lab') >= 0 && i % 3 === 0)
  await Promise.each(labSites, site =>
    insertDeviceWithGeneratedName(knex, {
      deviceTypeId: m2000DeviceTypeId,
      deviceApprovalId,
      partnerId: site.partnerId,
      siteId: site.id,
      defaultReportableSiteId: site.id,
      ...auditFields,
      lastPingOn: new Date(+now),
      lastPingFromIp: `61.21.30.${Math.floor(Math.random() * 255)}`,
      lastSeenOn: new Date(+now),
      putInService: subMonths(now, 2),
      hostId: _.times(8, () => String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))).join(''),
      serial: _.times(24, () => String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))).join(''),
    })
  )

  // get all devices that can process COVID (including GeneXperts)
  const devices = await knex('Device as d')
    .join('Site as s', 'd.siteId', 's.id')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .where({ 'd.partnerId': partnerId })
    .whereIn('c.a3', ['USA', 'NGA'])
    .whereIn('dt.externalId', ['AbbottM2000', 'CepheidGeneXpert'])
    .select('d.*', 'c.a3', 's.geographyId')

  const covidAssays = await knex('Assay as a')
    .whereIn('a.externalId', ['abbottM2000DaanNCOVID19', 'assayGXCovid19'])
    .select('a.*')

  // add results US
  await addCovidResults(
    knex,
    resultMultiplier,
    covidAssays,
    auditFields,
    _.filter(sites, s => s.a3 === 'USA'),
    partnerId,
    _.filter(devices, d => d.a3 === 'USA')
  )

  // add results
  await addCovidResults(
    knex,
    resultMultiplier,
    covidAssays,
    auditFields,
    _.filter(sites, s => s.a3 === 'NGA'),
    partnerId,
    _.filter(devices, d => d.a3 === 'NGA')
  )
}
