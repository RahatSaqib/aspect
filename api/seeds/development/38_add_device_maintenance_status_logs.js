module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const Promise = require('bluebird')
const { addDays, subDays, format, addHours, subHours, subMonths, parseISO } = require('date-fns')

const { errorCodes } = require('./fixtures/errorCodes.js')
const patients = require('./fixtures/patients.json')

const { allDeviceMaintenanceStatusToId } = require('../../src/shared/dictionary')

const { generateResults } = require('../commonGenerateResults')

const resultMultiplier = process.env['seeds.resultMultiplier'] || 100
const logHistoryMonths = Math.ceil(resultMultiplier / 100)
const now = new Date()
const historicMonth = subMonths(now, logHistoryMonths)
const minDate = parseISO(`${format(historicMonth, 'yyyy-MM-01')}T00:00:00.000Z`)
const maxDate = now

async function seed(knex) {
  const { partnerId, userId } = await knex('Person as p')
    .innerJoin('User as u')
    .where('u.name', 'admin')
    .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')
  const countryAbbreviation = 'US'
  const deviceMaintenanceStatusToId = await allDeviceMaintenanceStatusToId()

  const deviceIds = await knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .leftOuterJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .leftOuterJoin('Site as s', 'd.siteId', 's.id')
    .leftOuterJoin('Partner as p', 's.partnerId', 'p.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('Country as c', 'g.countryId', 'c.id')
    .where(function () {
      this.whereNull('da.token').orWhere('da.token', 'Approved')
    })
    .whereIn('dtc.name', ['Lab', 'Integrated', 'Information System'])
    .where('dt.externalId', 'CepheidGeneXpert')
    .where(function () {
      this.whereNull('p.id').orWhere('s.partnerId', partnerId)
    })
    .where('c.abbreviation', countryAbbreviation)
    .orderBy('d.name')
    .pluck('d.id')

  // ASP-2036 - Create a realistic, repeating, predefined activity pattern.
  // The array below defines for an n-th device what inactivity data should look like
  // Devices or date ranges that are not included are active
  const { active, inactiveUnknown, inactiveDownForRepair, inactiveOutOfInventory, inactiveNoTestsPerformed } =
    deviceMaintenanceStatusToId

  const activityPattern = [
    {
      deviceIndex: 2,
      statuses: [
        { status: inactiveDownForRepair, start: 1, end: 4 },
        { status: inactiveDownForRepair, start: 16, end: 31 },
      ],
    },
    {
      deviceIndex: 4,
      statuses: [
        {
          status: inactiveOutOfInventory,
          start: 1,
          end: 16,
        },
        {
          status: inactiveNoTestsPerformed,
          start: 23,
          end: 31,
        },
      ],
    },
    {
      deviceIndex: 8,
      statuses: [
        {
          status: inactiveUnknown,
          start: 4,
          end: 16,
        },
      ],
    },
    {
      deviceIndex: 10,
      statuses: [
        {
          status: inactiveDownForRepair,
          start: 18,
          end: 26,
        },
      ],
    },
    {
      deviceIndex: 13,
      statuses: [
        {
          status: inactiveNoTestsPerformed,
          start: 25,
          end: 31,
        },
      ],
    },
    {
      deviceIndex: 16,
      statuses: [
        {
          status: inactiveNoTestsPerformed,
          start: 1,
          end: 31,
        },
      ],
    },
    {
      deviceIndex: 19,
      statuses: [
        {
          status: inactiveDownForRepair,
          start: 1,
          end: 24,
        },
        {
          status: inactiveNoTestsPerformed,
          start: 25,
          end: 31,
        },
      ],
    },
    {
      deviceIndex: 23,
      statuses: [
        {
          status: inactiveOutOfInventory,
          start: 8,
          end: 19,
        },
      ],
    },
    {
      deviceIndex: 25,
      statuses: [
        {
          status: inactiveNoTestsPerformed,
          start: 26,
          end: 31,
        },
      ],
    },
    {
      deviceIndex: 28,
      statuses: [
        {
          status: inactiveDownForRepair,
          start: 9,
          end: 22,
        },
      ],
    },
    {
      deviceIndex: 31,
      statuses: [
        {
          status: inactiveNoTestsPerformed,
          start: 24,
          end: 31,
        },
      ],
    },
    {
      deviceIndex: 34,
      statuses: [
        {
          status: inactiveNoTestsPerformed,
          start: 26,
          end: 31,
        },
      ],
    },
    {
      deviceIndex: 36,
      statuses: [
        {
          status: inactiveDownForRepair,
          start: 16,
          end: 31,
        },
      ],
    },
  ]

  await Promise.each(deviceIds, async (deviceId, index) => {
    const dayAndStatus = []
    const patternForDevice = activityPattern.find(p => p.deviceIndex === index)
    for (let dayDate = minDate; dayDate < maxDate; dayDate = addDays(dayDate, 1)) {
      const dayOfMonth = dayDate.getUTCDate()
      const dayStatus = patternForDevice
        ? patternForDevice.statuses.find(p => p.start <= dayOfMonth && p.end >= dayOfMonth)
        : null
      if (!patternForDevice || !dayStatus) {
        // if no pattern specified for the device or there is a pattern, but it doesn't include the current day, the device should be active, unless it's a weekend (in which case there's a 5% chance the device is active)
        if ((dayDate.getUTCDay() !== 0 && dayDate.getUTCDay() !== 6) || _.random(1, true) < 0.1) {
          dayAndStatus.push({ dayDate, statusId: active })
        } else {
          dayAndStatus.push({ dayDate, statusId: inactiveNoTestsPerformed })
        }
      } else {
        dayAndStatus.push({
          dayDate,
          statusId: dayStatus ? dayStatus.status : inactiveNoTestsPerformed,
        })
      }
    }
    let deviceMaintenanceStatusLogId = null
    await Promise.each(dayAndStatus, async ({ dayDate, statusId }) => {
      const isWeekend = dayDate.getUTCDay() === 0 || dayDate.getUTCDay() === 6
      await setDeviceMaintenanceStatusLog(knex, deviceId, dayDate, statusId)

      if (_.random(0, 9) === 5 && statusId !== 1 && !isWeekend) {
        await setDeviceMaintenanceStatusLog(knex, deviceId, dayDate, statusId, userId, {
          notes: '',
          dateTo: dayDate,
          dateFrom: dayDate,
          externalId: statusId,
        })
      }
      deviceMaintenanceStatusLogId = await setDeviceMaintenanceStatusLog(knex, deviceId, dayDate, statusId)
      if (statusId === active) {
        await ensureResultExists(knex, deviceId, dayDate, userId, partnerId)
      } else {
        await ensureResultDoesNotExist(knex, deviceId, dayDate)
      }
    })
    if (deviceMaintenanceStatusLogId) {
      await knex('Device').where('id', deviceId).update({
        deviceMaintenanceStatusLogId,
      })
    }
  })
}

async function setDeviceMaintenanceStatusLog(
  knex,
  deviceId,
  dayDate,
  deviceMaintenanceStatusId,
  createdBy = false,
  data = false
) {
  const [deviceMaintenanceStatusLogId] = await knex('DeviceMaintenanceStatusLog').insert({
    deviceId,
    deviceMaintenanceStatusId,
    data: data ? JSON.stringify(data) : '{}',
    day: dayDate,
    createdOn: now,
    createdBy: createdBy || null,
  })
  return deviceMaintenanceStatusLogId
}

async function getResultsOnDay(knex, deviceId, dayDate) {
  return knex('Result').where({ deviceId }).whereRaw('DATE(endedOn) = DATE(?)', dayDate).select('id')
}

async function generateResultForDay(knex, deviceId, dayDate, userId, partnerId) {
  await generateResults(knex, userId, partnerId, patients, errorCodes, 'US', false, 1, 0, 0, 0, deviceId, dayDate)
}

async function ensureResultExists(knex, deviceId, dayDate, userId, partnerId) {
  const resultIds = await getResultsOnDay(knex, deviceId, dayDate)
  if (resultIds.length === 0) {
    // add hours so the result doesn't have an endedOn date around midnight
    let resultDate = addHours(dayDate, _.random(11, 13))
    if (resultDate > subHours(new Date(), 5)) {
      resultDate = subDays(resultDate, 1)
    }
    await generateResultForDay(knex, deviceId, resultDate, userId, partnerId)
  }
}

async function ensureResultDoesNotExist(knex, deviceId, dayDate) {
  const resultIds = await getResultsOnDay(knex, deviceId, dayDate)
  if (resultIds.length > 0) {
    await moveResultFromDay(knex, deviceId, dayDate, resultIds)
  }
}

async function moveResultFromDay(knex, deviceId, dayDate, resultIds) {
  // move result to a date before the min date range, somewhere between 10am and 3pm
  const daysToSubtract = (dayDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) + _.random(5, 20)
  const minutesToSubtract = daysToSubtract * 24 * 60 + _.random(10 * 60, 15 * 60)

  await knex('Result')
    .update({
      startedOn: knex.raw('DATE_SUB(startedOn, INTERVAL ? MINUTE)', minutesToSubtract),
      endedOn: knex.raw('DATE_SUB(endedOn, INTERVAL ? MINUTE)', minutesToSubtract),
    })
    .whereIn('id', resultIds)
}
