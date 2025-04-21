const { addDays, subDays } = require('date-fns')
const _ = require('lodash')
const Promise = require('bluebird')
const { inventoryStockout, inventoryStockExpiring } = require('../inventory/actions')
const {
  factGenerateDeviceConnectivity,
  factGenerateResultCounts,
  factDataCategoryLow,
  factNewResultsAvailable,
  siteWithLowCompletionRateIssue,
} = require('./actions')
const { resolveIssues, escalateIssues } = require('../issue/actions')
const { deviceOnline, deviceNoResults, deviceHasNewResults } = require('../device/actions')
const { issueTypeToId, issueStatusToId, issueEventStatusToId } = require('../shared/dictionary')
const { auditInventoryStockout, auditInventoryStockExpiring } = require('../shared/utilsInventory')
const logger = require('../shared/logger')
const config = require('../config')

const MIN_RESULTS_TO_TRIGGER_DATA_CATEGORY_LOW = 10

const MIN_PERCENTAGE_FIELDS_COMPLETION_RATE = 0.8

async function onFactGenerateDeviceConnectivity({ deviceId }, { messageContext }) {
  const context = messageContext.bindActionCreators({
    deviceNoResults,
  })
  return context.run(async knex => {
    // If we don't have facts yet for devices we care about, generate them
    // with defaults values
    const now = new Date()
    const deviceNoFactsQ = knex('Device as d')
      .leftJoin('FactDeviceFlag as f', 'f.deviceId', 'd.id')
      .whereNull('f.deviceId')
      .select('d.id')
    if (deviceId != null) {
      deviceNoFactsQ.where({ 'd.id': deviceId })
    }
    const noFactDevices = (await deviceNoFactsQ).map(d => ({
      deviceId: d.id,
      updatedOn: now,
    }))
    await knex.batchInsert('FactDeviceFlag', noFactDevices, 25)

    const queryBase = knex('Device as d')
      .join('FactDeviceFlag as f', 'f.deviceId', 'd.id')
      .join('Partner as p', 'd.partnerId', 'p.id')
      // if already have connectivity flag, no reason to calculate again
      .where({ 'f.offline': 0, 'f.noResults': 0 })
      .select(
        'd.id',
        'p.maxDaysDeviceOffline',
        'p.maxDaysDeviceNoResults',
        'd.lastPingOn',
        'd.lastSeenOn',
        'd.createdOn as deviceCreatedOn',
        'f.maintenance',
        'f.maintenanceDueOn',
        knex('Result as r')
          .whereRaw('r.deviceId = d.id')
          .select(knex.raw('max(coalesce(r.endedOn, r.startedOn, r.updatedOn))'))
          .as('lastResultOn')
      )
    if (deviceId != null) {
      // constrain by single device specified by action, or query all
      // devices on schedule
      queryBase.where({ 'd.id': deviceId })
    }
    const devicesQ = await queryBase
    devicesQ.map(
      ({ id, maxDaysDeviceNoResults, lastSeenOn, deviceCreatedOn, lastResultOn, maintenance, maintenanceDueOn }) => {
        const maxLastDateNoResult = maxDaysDeviceNoResults == null ? null : subDays(now, maxDaysDeviceNoResults)
        // TODO move #days to partner config
        const maxMaintenanceDateNoResult = addDays(lastSeenOn, 30)

        // If we haven't seen a result, use deviceCreatedOn for checks
        if (lastResultOn == null) {
          lastResultOn = deviceCreatedOn
        }

        // Only signal a DEVICE_NO_RESULTS action if the device has
        // been connected before the last result was expected
        if (maxLastDateNoResult != null && deviceCreatedOn < maxLastDateNoResult) {
          if (lastResultOn <= maxLastDateNoResult) {
            // OR no tests run > Y days
            context.deviceNoResults(id, { lastResultOn })
          } else if (
            maintenance === 1 &&
            maintenanceDueOn != null &&
            maxMaintenanceDateNoResult != null &&
            maintenanceDueOn >= maxMaintenanceDateNoResult
          ) {
            // OR inactive - expected back date > Z days
            context.deviceNoResults(id, { lastResultOn })
          } else if (maintenance === 1 && maintenanceDueOn != null && now > maintenanceDueOn) {
            // OR date passes expected back date
            context.deviceNoResults(id, { lastResultOn })
          }
        }

        return id // for lint
      }
    )
  })
}

async function onDeviceSeen({ deviceId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ deviceOnline })
  return context.run(async knex => {
    // Mark device online if seen more recently than offline
    const offlineDevice = await knex('Device as d')
      .leftJoin('FactDeviceFlag as fdf', 'd.id', 'fdf.deviceId')
      .where('d.id', deviceId)
      .where(function () {
        // If we don't fact yet, seen for first time, consider this online
        this.whereNull('fdf.deviceId')
          // If fact is marked offline and we've seen the device more recently
          // then the update, we are also online
          .orWhereRaw('fdf.offline = 1 and (fdf.updatedOn <= IFNULL(d.lastSeenOn, fdf.updatedOn))')
      })
      .first('d.id')

    if (offlineDevice != null) {
      context.deviceOnline(offlineDevice.id)
    }
  })
}

function onDeviceUpdateFlag(updates) {
  return async ({ deviceId, options }, { messageContext }) => {
    const context = messageContext.bindActionCreators({
      factGenerateDeviceConnectivity,
    })
    return context.run(async knex => {
      const flagUpdates = { updatedOn: new Date(), ...updates }

      if (updates.maintenance === 1 && options != null && options.dueOn != null) {
        flagUpdates.maintenanceDueOn = new Date(options.dueOn)
      } else if (updates.maintenance === 0) {
        flagUpdates.maintenanceDueOn = null
      }

      const record = { deviceId, ...flagUpdates }
      await knex('FactDeviceFlag').insert(record).onConflict(['deviceId']).merge()

      // flags have been updated, check connectivity again for this device with
      // updated flags in case resolved updates triggered different issue conditions
      context.factGenerateDeviceConnectivity(deviceId)
    })
  }
}

async function onResultLogged({ resultId }, { messageContext }) {
  const context = messageContext.bindActionCreators({
    factGenerateResultCounts,
    deviceHasNewResults,
  })
  return context.transact(async knex => {
    const {
      deviceId,
      assayId,
      resultCategory1,
      resultCategory2,
      noResults,
      endedOn,
      startedOn,
      createdOn,
      deviceType,
      maxDaysDeviceNoResults,
    } =
      (await knex('Result as r')
        .leftJoin('Partner as p', 'r.partnerId', 'p.id')
        .leftJoin('FactDeviceFlag as fdf', 'fdf.deviceId', 'r.deviceId')
        .leftJoin('Device as d', 'd.id', 'r.deviceId')
        .leftJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
        .where('r.id', resultId)
        .first(
          'r.deviceId',
          'r.assayId',
          'r.resultCategory1',
          'r.resultCategory2',
          'fdf.noResults',
          'r.endedOn',
          'dt.externalId as deviceType',
          'p.maxDaysDeviceNoResults'
        )) || {}

    if (!deviceId) {
      return
    }
    const now = new Date()
    const maxLastDateNoResult = subDays(now, maxDaysDeviceNoResults || config.maxDaysDeviceNoResults)

    const resultDate = endedOn || startedOn || createdOn

    // if no results flag is set, and incoming result date is  within last configured days
    if (noResults === 1 && resultDate > maxLastDateNoResult) {
      context.deviceHasNewResults(deviceId)
    }

    try {
      if (endedOn && deviceType === 'CepheidGeneXpert') {
        await updateFactDeviceModulesCount(deviceId, endedOn, knex)
      }
    } catch (err) {
      logger.error(err)
    }

    context.factGenerateResultCounts(deviceId, {
      assayId,
      resultCategory1,
      resultCategory2,
      endedOn,
    })
  })
}

async function updateFactDeviceModulesCount(deviceId, resultEndedOn, knex) {
  const date = new Date(resultEndedOn.toDateString())
  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)

  const rows = await knex('Result as r')
    .where('r.endedOn', '>=', date)
    .where('r.endedOn', '<', nextDay)
    .where('r.deviceId', deviceId)
    .distinct('r.instrumentSerial', 'r.moduleName', 'r.moduleSerial')

  const device = {
    moduleBays: {},
    modules: {},
  }
  rows.forEach(row => {
    const moduleBay = `${row.instrumentSerial ?? ''}${row.moduleName ?? ''}`
    const module = `${row.instrumentSerial ?? ''}${row.moduleSerial ?? ''}`
    if (moduleBay) device.moduleBays[moduleBay] = 1
    if (module) device.modules[module] = 1
  })

  const moduleBaysUsed = Object.keys(device.moduleBays).length
  const modulesUsed = Object.keys(device.modules).length

  const record = { deviceId, date, moduleBaysUsed, modulesUsed }
  await knex('FactDeviceModulesCount').insert(record).onConflict(['deviceId', 'date']).merge()
}

// ----------------------------------------------
// This function is triggered by scheduler, and checks stock for all sites
// ----------------------------------------------
async function onFactCheckInventoryStock(action, { messageContext }) {
  const context = messageContext.bindActionCreators({
    inventoryStockout,
    inventoryStockExpiring,
    resolveIssues,
    escalateIssues,
  })

  // loop all sites and audit each consumables
  return context.run(async knex => {
    const now = new Date()

    // get list of inventory details grouped by site/consumable
    const sites = await knex('InventoryItem as ii')
      .innerJoin('Site as s', 'ii.siteId', 's.id')
      .innerJoin('Partner as p', 's.partnerId', 'p.id')
      .where(function () {
        this.whereNull('ii.expiresOn') // if is null
          .orWhere('ii.expiresOn', '>', now) // or unexpired
      })
      .groupBy('ii.siteId', 'ii.consumableId')
      .select(
        'ii.siteId',
        'ii.consumableId',
        knex.raw('MAX(p.dueDaysInventoryStockout) as dueDaysInventoryStockout'),
        knex.raw('MAX(p.dueDaysInventoryStockExpiring) as dueDaysInventoryStockExpiring')
      )

    // loop all sites and for each check if there are enough inventory items in stock
    return Promise.each(sites, async site => {
      const { siteId, consumableId } = site
      // notice that 'rate' field in table FactInventoryConsumptionRate stores total number of
      // tests during corresponding 'days'. So for actual rate you should do rate/days, but
      // for days=1 use 'rate' as-is
      const { rate: dailyRate } = (await knex('FactInventoryConsumptionRate')
        .where({ siteId, consumableId, days: 1 })
        .first('rate')) || { rate: 0 }

      if (dailyRate > 0) {
        const props = {
          knex,
          site,
          dailyRate,
          resolver: context.resolveIssues,
          escalator: context.escalateIssues,
        }
        // Stockout - check if issue may be triggered, resolved or escalated
        await auditInventoryStockout({
          ...props,
          dueDays: site.dueDaysInventoryStockout,
          trigger: context.inventoryStockout,
        })
        // Stock Expiring - check if issue may be triggered, resolved or escalated
        await auditInventoryStockExpiring({
          ...props,
          dueDays: site.dueDaysInventoryStockExpiring,
          trigger: context.inventoryStockExpiring,
        })
      }
    })
  })
}

// -------------------------------------------------------------------------------------
// ---
// --- Data Category Low
// ---
// -------------------------------------------------------------------------------------
async function checkDataCategoriesForLowStatus(action, { messageContext }) {
  const context = messageContext.bindActionCreators({
    factDataCategoryLow,
  })
  const { loadPlugin } = require('../plugin/loadPlugin')
  const now = new Date()
  // calculate only for last 30 days
  const period = {
    name: 'last 30 days',
    dateFrom: subDays(now, 30),
    dateTo: now,
  }

  const issueStatusId = await issueStatusToId('Active')
  const triggeredIssueEventStatusId = await issueEventStatusToId('Triggered')

  return context.run(async knex => {
    // get all partners with defined plugin
    const partners = await knex('Partner').whereNotNull('plugin').select('id', 'plugin')

    // loop all partners
    await Promise.each(partners, async ({ id: partnerId, plugin: partnerPluginName }) => {
      const { dataCategories = [] } = await loadPlugin(partnerPluginName, undefined, 'dataCategories')
      // check data categories for 'low status'
      return Promise.each(dataCategories, async dataCategory => {
        const { externalId: categoryToken } = dataCategory
        const issueTypeId = await issueTypeToId(`DataCategoryLowFor${categoryToken}`)

        // get all sites for current partnerId
        const sites = await knex('Site').where({ partnerId }).select('id', 'name')

        // for each site
        return Promise.each(sites, async site => {
          const siteId = site.id
          // check if this type of IssueEvent has already been triggered and is Active
          const triggeredIssue = await knex('Issue as i')
            .innerJoin('IssueEvent as ie', 'i.id', 'ie.issueId')
            .where('i.siteId', siteId)
            .where('i.partnerId', partnerId)
            .where('i.level', 1)
            .where('i.issueTypeId', issueTypeId) // issue type 'DataCategoryLowFor*'
            .where('i.issueStatusId', issueStatusId) // is Active
            .where('ie.issueEventStatusId', triggeredIssueEventStatusId)
            .first()
          // if issue has already been triggered for current site and is Active then exit
          if (triggeredIssue) {
            return
          }

          const props = { period, siteId, dataCategory }
          const categoryStatus = await getDataCategoryStatus(knex, props)
          const { totals } = categoryStatus

          // ----------------------------
          // trigger only if
          // ----------------------------
          // site has more than N results for the period
          if (totals < MIN_RESULTS_TO_TRIGGER_DATA_CATEGORY_LOW) {
            return
          }
          // and percentage is less than threshold
          let { percentage } = categoryStatus
          if (percentage < dataCategory.cutoffPercentage) {
            percentage =
              percentage < 10
                ? Math.floor(10 * percentage) / 10 // ##.#
                : Math.floor(percentage) // ##

            const payload = {
              categoryToken,
              categoryName: dataCategory.name,
              periodName: period.name,
              siteId,
              percentage,
            }

            context.factDataCategoryLow(payload)
          }
        })
      })
    })
  })
}

// helper function for getting Data Category Low status
async function getDataCategoryStatus(knex, { period: { dateFrom, dateTo }, siteId, dataCategory }) {
  const validValues = dataCategory.validValues && JSON.parse(dataCategory.validValues)
  // lower 1st character because props in patientData follow cammel-case naming convention
  const { externalId } = dataCategory
  const categoryToken = externalId[0].toLowerCase() + externalId.substring(1)

  // base query for getting counts - totals and number of valid results
  const itemsBase = knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .where('r.endedOn', '>=', dateFrom)
    .where('r.endedOn', '<=', dateTo)
    .where(`d.siteId`, siteId)

  // get totals
  const [{ count: totals }] = await itemsBase.clone().countDistinct('r.id as count')

  let percentage = 0
  let numValid = 0
  if (totals > 0) {
    // get number of valid results
    ;[{ count: numValid }] = await itemsBase
      .clone()
      .whereNotNull('r.patientData')
      .where(function () {
        // process 2 main cases - validValues is an array (all categories except Other) or not (category Other)
        if (validValues && _.isArray(validValues)) {
          // field exists in json
          this.whereRaw(`(r.patientData ->> '$.${categoryToken}') is not null`)
          this.andWhere(function () {
            // check if category is one of valid values
            _.each(validValues, value => {
              this.orWhereRaw(`(r.patientData ->> '$.${categoryToken}') = ?`, [value])
            })
          })
        } else {
          // get all fields for 'Other' category (i.e. "name", "gender", "age")
          const fieldNames = JSON.parse(dataCategory.fieldNames)
          _.map(fieldNames, field => {
            // field value is not null (when field is missing), "undefined", "null" or ""
            this.whereRaw(
              `
              (r.patientData ->> '$.${field}') is not null
              and
              (r.patientData ->> '$.${field}') != 'undefined'
              and
              (r.patientData ->> '$.${field}') != 'null'
              and
              (r.patientData ->> '$.${field}') != ''
              `
            )
            // ^^^ notice that we require ALL fields (i.e. name, gender, age) have value to count result as valid
            // if need at least one field to have value then use this.orWhereRaw above
          })
        }
      })
      .countDistinct('r.id as count')

    percentage = 100 * (numValid / totals)
  }

  return {
    totals,
    numValid,
    percentage,
  }
}

// ----------------------------------------------
// This function is triggered by scheduler, and checks if new results are available for any sample origin sites
// ----------------------------------------------
async function onFactNewResultsAvailableCheck(action, { messageContext }) {
  const context = messageContext.bindActionCreators({
    factNewResultsAvailable,
  })

  // loop all sites and audit each consumables
  return context.run(async knex => {
    const now = new Date()
    // get sample origin sites that have new results in last 24 hours
    // TODO: Enable Issues for persons. Currently triggering a notification for every origin site. That means people who have access to more than one site will receive a separate notification for each site.
    const sites = await knex('Result as r')
      .leftJoin('Site as s', 'r.siteId', 's.id')
      .innerJoin('Sample as sa', 'r.sampleId', 'sa.id')
      .innerJoin('Site as si', 'sa.originSiteId', 'si.id')
      .innerJoin('ResultType as rt', 'r.resultTypeId', 'rt.id')

      .groupBy('si.id')
      .where('r.createdOn', '>', subDays(now, 1))
      .where('r.endedOn', '>', subDays(now, 30))
      .where('rt.excluded', false)
      .select(
        knex.raw('si.id as siteId'),
        knex.raw('coalesce(r.partnerId, si.partnerId) as partnerId'),
        knex.raw('coalesce(s.geographyId, si.geographyId) as geographyId')
      )
      .count('r.id as numberOfResults')
      .having(knex.raw('count(r.id) > 0'))

    // loop all and trigger issue
    return Promise.each(sites, async site => {
      context.factNewResultsAvailable(site)
    })
  })
}

async function onFactCompletionRatePerSite(action, { messageContext }) {
  const context = messageContext.bindActionCreators({
    siteWithLowCompletionRateIssue,
  })

  return context.run(async knex => {
    const now = new Date()
    // get sites with completion rate above the 80%

    const sitesWithLowCompletionRate = await knex('FactCustomFieldCompletion as fcr')
      .join('Site as si', 'si.id', 'fcr.siteId')
      .where('fcr.date', '>=', subDays(now, 30))
      .select(
        'fcr.siteId',
        knex.raw('SUM(completionRate*recordCount)/SUM(recordCount) as completionRatePerSite'),
        'si.partnerId as partnerId',
        'si.geographyId as geographyId'
      )
      .groupBy('fcr.siteId', 'partnerId', 'geographyId')
      .having(knex.raw('completionRatePerSite < ?', [MIN_PERCENTAGE_FIELDS_COMPLETION_RATE]))

    // loop all and trigger issue
    return Promise.each(sitesWithLowCompletionRate, async site => context.siteWithLowCompletionRateIssue(site))
  })
}

module.exports = {
  onFactGenerateDeviceConnectivity,
  onFactCheckInventoryStock,
  onDeviceSeen,
  onDeviceUpdateFlag,
  onResultLogged,
  checkDataCategoriesForLowStatus,
  getDataCategoryStatus,
  MIN_RESULTS_TO_TRIGGER_DATA_CATEGORY_LOW,
  MIN_PERCENTAGE_FIELDS_COMPLETION_RATE,
  onFactNewResultsAvailableCheck,
  onFactCompletionRatePerSite,
}
