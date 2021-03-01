module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const Promise = require('bluebird')
const {
  addDays,
  format,
  isWeekend,
  subMonths,
  parseISO,
  getDate,
} = require('date-fns')

const {
  allDeviceMaintenanceStatusToId,
} = require('../../src/shared/dictionary')

async function seed(knex) {
  const now = new Date()
  const previousMonth = subMonths(now, 1)
  const minDate = parseISO(
    `${format(previousMonth, 'yyyy-MM-01')}T00:00:00.000Z`
  )
  const maxDate = now

  const { partnerId } = await knex('Person as p')
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
    .pluck('d.id')

  // ----------------------------
  // helper funcs
  // ----------------------------
  const setDmsl = async (deviceId, dayDate, deviceMaintenanceStatusId) => {
    const day = format(dayDate, 'yyyy-MM-dd')
    const [deviceMaintenanceStatusLogId] = await knex(
      'DeviceMaintenanceStatusLog'
    ).insert({
      deviceId,
      deviceMaintenanceStatusId,
      data: '{}',
      day,
      createdOn: now,
    })

    await knex('Device').where({ id: deviceId }).update({
      deviceMaintenanceStatusLogId,
    })
  }
  // ----------------------------
  const getStatusId = date => {
    /**
     * ASP-1772:
     * Should be 80% Active on average, with some variation from day to day
     * The remaining 20% should be distributed as follows:
     * - Seed "Out of Inventory" for the previous month so that it slightly increases over time.
     *   Maybe from around 5% to around 15% by the 22nd of the month and drop it to 0 after that.
     * - "Down for Repair" between 3-5%
     * - The rest "Unknown", but this category should grow larger towards the end of the month, up to 20%.
     */
    const getPcInactiveDownForRepair = dayNum => {
      if (dayNum <= 22) {
        // ranges from 5 (beginning of the month) to 15 (around 22nd)
        return 4 + Math.round((dayNum % 23) / 2)
      }
      return 0
    }
    const dayNumber = getDate(date)
    const pc = _.random(0, 100)
    const pcActive = _.random(75, 80)
    const pcInactiveNoStaff = pcActive + _.random(1, 2)
    const pcInactiveNoPower = pcInactiveNoStaff + _.random(1, 2)
    const pcInactiveOther = pcInactiveNoPower + _.random(1, 2)
    const pcInactiveDownForRepair = pcInactiveOther + _.random(3, 5)
    const pcInactiveOutOfInventory =
      pcInactiveDownForRepair + getPcInactiveDownForRepair(dayNumber)
    if (pc <= pcActive) {
      return deviceMaintenanceStatusToId.active
    }
    if (pc <= pcInactiveNoStaff) {
      return deviceMaintenanceStatusToId.inactiveNoStaff
    }
    if (pc <= pcInactiveNoPower) {
      return deviceMaintenanceStatusToId.inactiveNoPower
    }
    if (pc <= pcInactiveOther) {
      return deviceMaintenanceStatusToId.inactiveOther
    }
    if (pc <= pcInactiveDownForRepair) {
      return deviceMaintenanceStatusToId.inactiveDownForRepair
    }
    if (pc <= pcInactiveOutOfInventory) {
      return deviceMaintenanceStatusToId.inactiveOutOfInventory
    }
    return deviceMaintenanceStatusToId.inactiveUnknown
  }
  // ----------------------------
  // update DeviceMaintenanceStatusLog's
  // ----------------------------
  await Promise.each(deviceIds, async deviceId => {
    const dayAndStatus = []
    for (
      let dayDate = minDate;
      dayDate < maxDate;
      dayDate = addDays(dayDate, 1)
    ) {
      if (isWeekend(dayDate)) {
        dayAndStatus.push({
          dayDate,
          statusId: deviceMaintenanceStatusToId.inactiveUnknown,
        })
      } else {
        dayAndStatus.push({
          dayDate,
          statusId: getStatusId(dayDate),
        })
      }
    }

    await Promise.each(dayAndStatus, ({ dayDate, statusId }) =>
      setDmsl(deviceId, dayDate, statusId)
    )
  })
}
