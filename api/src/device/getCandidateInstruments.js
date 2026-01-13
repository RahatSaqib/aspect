const Boom = require('@hapi/boom')
const _ = require('lodash')
const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

function getCandidateInstrumentsData(deviceId, dataConstraints) {
  const query = knex('Device as d')
    .join('DeviceApiKey as dak', 'd.deviceApiKeyId', 'dak.id')
    .join('Site as s', 'd.siteId', 's.id')
    .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .leftJoin('Instrument as i', function () {
      this.on('i.deviceId', 'd.id')
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
    .leftJoin('Deployment as dep', function () {
      this.on('dep.deviceId', 'd.id').andOnNull('dep.end')
    })

    .where(function () {
      // If source device has active deployment, candidate must have active deployment with same Deployment.siteId
      // If source device has no active deployment, candidate must also have no active deployment
      this.where(function () {
        // Source device has active deployment - candidate must have same Deployment.siteId
        this.whereExists(function () {
          this.select('depSource.id')
            .from('Deployment as depSource')
            .where('depSource.deviceId', deviceId)
            .whereNull('depSource.end')
        }).andWhere(function () {
          // Candidate has active deployment with same Deployment.siteId
          this.whereExists(function () {
            this.select('*')
              .from('Deployment as depCandidate')
              .whereRaw('depCandidate.deviceId = d.id')
              .whereNull('depCandidate.end')
              .whereIn('depCandidate.siteId', function () {
                this.select('siteId')
                  .from('Deployment as depSource')
                  .where('depSource.deviceId', deviceId)
                  .whereNull('depSource.end')
              })
          })
        })
      }).orWhere(function () {
        // Source device has no active deployment - candidate must also have no active deployment
        this.whereNotExists(function () {
          this.select('*')
            .from('Deployment as depSource')
            .where('depSource.deviceId', deviceId)
            .whereNull('depSource.end')
        }).andWhere(function () {
          // Candidate also has no active deployment
          this.whereNotExists(function () {
            this.select('*')
              .from('Deployment as depCandidate')
              .whereRaw('depCandidate.deviceId = d.id')
              .whereNull('depCandidate.end')
          })
        })
      })
    })
    .where(function () {
      // Same token as deviceApiKey as source device
      this.whereIn('dak.token', function () {
        this.select('token')
          .from('Device as d')
          .join('DeviceApiKey as dak', 'd.deviceApiKeyId', 'dak.id')
          .where('d.id', deviceId)
      })
    })
    .whereIn('da.token', ['approved', 'pendingDeployment'])
    .whereNot('d.id', deviceId) // Exclude the source device itself
    .whereNotNull('i.serial') // Only include devices with instruments
    .groupBy('d.id', 'd.name', 'i.serial')
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
    })
    .select(
      'd.id as deviceId',
      'd.name as deviceName',
      'i.serial as instrumentSerial',
      knex.raw('json_arrayagg(m.modules) as modules')
    )

  return query
}

async function getCandidateInstruments({ params, auth }) {
  const { deviceId } = params

  // Get user constraints
  const dataConstraints = await getConstraints(auth.credentials)

  // Verify source device exists and get its info
  const sourceDevice = await knex('Device as d')
    .join('DeviceApiKey as dak', 'd.deviceApiKeyId', 'dak.id')
    .join('Site as s', 'd.siteId', 's.id')
    .where('d.id', deviceId)
    .select('d.id', 'd.siteId', 'dak.token as deviceApiKey')
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
    })
    .first()

  if (!sourceDevice) {
    return Boom.notFound('Device not found')
  }

  // Get candidate instruments data with constraints applied
  const instrumentRows = await getCandidateInstrumentsData(deviceId, dataConstraints)

  // For each instrument, use the prefix from the most recent module to build an array of 4 modules (e.g. B1-B4),
  // filling in any missing modules with null for lastResultDate.
  const instruments = instrumentRows.map(instrument => {
    const modulesData = instrument.modules ? JSON.parse(instrument.modules) : []
    const mostRecentModule = _.maxBy(modulesData, m => m.lastResultDate || '')
    const moduleNameLetter = mostRecentModule ? mostRecentModule.moduleName.charAt(0) : 'B'

    const modules = [1, 2, 3, 4].map(moduleNumber => {
      const moduleName = `${moduleNameLetter}${moduleNumber}`
      const moduleInfo = modulesData.find(m => m.moduleName === moduleName)
      return {
        moduleName,
        lastResultDate: moduleInfo ? moduleInfo.lastResultDate : null,
      }
    })

    return {
      deviceId: instrument.deviceId,
      deviceName: instrument.deviceName,
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

module.exports = {
  getCandidateInstruments,
}
