module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const Promise = require('bluebird')

const { addCovidResults } = require('../commonGenerateResults')

const { getPartnerByExternalId } = require('../utils')

const { deviceTypeToId, deviceApprovalToId } = require('../../src/shared/dictionary')

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

  // Add an m2000 to every 3rd lab in US and Nigeria
  await Promise.each(
    _.filter(sites, s => s.name.indexOf('Lab') >= 0),
    (site, i) => {
      if (i % 3 === 0) {
        addM2000DeviceForCovid(knex, auditFields, site, deviceApprovalId, m2000DeviceTypeId)
      }
    }
  )

  // get all devices that can process COVID (including GeneXperts)
  const devices = await knex('Device as d')
    .join('Geography as g', 'd.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .where({ partnerId })
    .whereIn('c.a3', ['USA', 'NGA'])
    .whereIn('dt.externalId', ['AbbottM2000', 'CepheidGeneXpert'])
    .select('d.*', 'c.a3')

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

async function addM2000DeviceForCovid(knex, auditFields, site, deviceApprovalId, m2000DeviceTypeId) {
  const device = {
    ...auditFields,
    name: `${site.name} M2000`.substr(0, 255),
    shortName: `${site.externalId}_AbbottM2000`.substr(0, 45),
    deviceTypeId: m2000DeviceTypeId,
    deviceApprovalId,
    partnerId: site.partnerId,
    geographyId: site.geographyId,
    siteId: site.id,
    defaultReportableSiteId: site.id,
    ...auditFields,
    lastPingOn: new Date(+now),
    lastSeenOn: new Date(+now),
    hostId: _.times(8, () => String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))).join(''),
    serial: _.times(24, () => String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))).join(''),
  }

  ;[device.id] = await knex('Device').insert(device)
}
