const Boom = require('@hapi/boom')
const _ = require('lodash')
const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

async function getCandidateInstruments({ params, auth }) {
  const { deviceId } = params

  // Get user constraints
  const dataConstraints = await getConstraints(auth.credentials)

  // Verify base device exists and get its info
  const baseDevice = await knex('Device as d')
    .leftJoin('DeviceApiKey as dak', 'd.deviceApiKeyId', 'dak.id')
    .leftJoin('Site as s', 'd.siteId', 's.id')
    .where('d.id', deviceId)
    .select('d.id', 'd.siteId', 'dak.token as deviceApiKey')
    .modify(
      addConstraints,
      dataConstraints,
      {
        device: 'd',
        site: 's',
      },
      { showUnapprovedDevices: true }
    )
    .first()

  if (!baseDevice) {
    return Boom.notFound('Device not found')
  }

  if (!baseDevice.deviceApiKey) {
    return {
      ok: true,
      data: {
        deviceId,
        instruments: [],
      },
    }
  }

  // Get candidate instruments data with constraints applied
  const instrumentRows = await getCandidateInstrumentsData(deviceId, dataConstraints)

  // For each instrument, use the name from the most recent module to build an array of 4 modules (e.g. if latest module = B2 => B1-B4),
  // filling in any missing modules with null for lastResultDate.
  const instruments = instrumentRows.map(instrument => {
    const modulesData = instrument.modules ? JSON.parse(instrument.modules) : []
    const mostRecentModule = _.maxBy(modulesData, m => m?.lastResultDate || '')
    const moduleNameLetter = mostRecentModule?.moduleName ? mostRecentModule.moduleName.charAt(0) : '?'

    const modules = [1, 2, 3, 4].map(moduleNumber => {
      const moduleName = `${moduleNameLetter}${moduleNumber}`
      const moduleInfo = modulesData.find(m => m?.moduleName === moduleName)
      return {
        moduleName,
        lastResultDate: moduleInfo ? moduleInfo.lastResultDate : null,
      }
    })

    return {
      deviceId: instrument.deviceId,
      deviceName: instrument.deviceName,
      instrumentId: instrument.instrumentId,
      instrumentSerial: instrument.instrumentSerial,
      modules,
    }
  })

  return {
    ok: true,
    data: {
      deviceId,
      instruments,
    },
  }
}

function getCandidateInstrumentsData(deviceId, dataConstraints) {
  const query = knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .join('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .join('Instrument as i', function () {
      this.on('i.deviceId', 'd.id')
    })
    .leftJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('Deployment as baseDep', function () {
      this.on('baseDep.deviceId', knex.raw('?', deviceId)).andOnNull('baseDep.end')
    })
    .leftJoin(
      knex('Result as r')
        .whereNotNull('r.instrumentSerial')
        .groupBy('r.deviceId', 'r.instrumentSerial', 'r.moduleName')
        .select(
          'r.deviceId',
          'r.instrumentSerial',
          'r.moduleName',
          knex.raw(`json_object('moduleName', r.moduleName, 'lastResultDate', date(max(r.endedOn))) as modules`)
        )
        .as('m'),
      function () {
        this.on('m.deviceId', 'd.id').andOn('m.instrumentSerial', 'i.serial')
      }
    )
    .leftJoin('Deployment as candidateDep', function () {
      this.on('candidateDep.deviceId', 'd.id').andOnNull('candidateDep.end')
    })
    .where('dt.externalId', 'CepheidGeneXpert')
    .where(function () {
      // If base device has active deployment, candidate must have active deployment with same Deployment.siteId
      // If base device has no active deployment, candidate must also have no active deployment
      this.where(function () {
        // base device has active deployment - candidate must have same Deployment.siteId
        this.whereNotNull('baseDep.id').andWhere('baseDep.siteId', knex.raw('candidateDep.siteId'))
      }).orWhere(function () {
        // base device has no active deployment - candidate must also have no active deployment
        this.whereNull('baseDep.id').whereNull('candidateDep.id')
      })
    })
    .where(function () {
      // Same token as deviceApiKey as base device
      this.whereIn('d.deviceApiKeyId', function () {
        this.select('sd.deviceApiKeyId').from('Device as sd').where('sd.id', deviceId)
      })
    })
    .whereIn('da.token', ['approved', 'pendingDeployment'])
    .whereNot('d.id', deviceId) // Exclude the base device itself
    .whereNotNull('i.serial') // Only include devices with instruments
    .groupBy('d.id', 'd.name', 'i.id', 'i.serial')
    .modify(
      addConstraints,
      dataConstraints,
      {
        device: 'd',
        site: 's',
      },
      { showUnapprovedDevices: true }
    )
    .select(
      'd.id as deviceId',
      'd.name as deviceName',
      'i.id as instrumentId',
      'i.serial as instrumentSerial',
      knex.raw('json_arrayagg(m.modules) as modules')
    )
  return query
}

module.exports = {
  getCandidateInstruments,
}
