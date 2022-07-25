require('isomorphic-fetch')
const { createFetch, base, accept, header, method, body } = require('http-client')
const { subMonths, startOfMonth } = require('date-fns')
const _ = require('lodash')
const Promise = require('bluebird')

const config = require('../../config')
const { deviceTypeToId } = require('../../shared/dictionary')
const { formatDateOrDefault, parseDateOrDefault } = require('../../shared/date')

function utcDate(localDateTime) {
  return parseDateOrDefault(`${formatDateOrDefault(localDateTime, 'yyyy-MM-dd')}T00:00:00.000Z`)
}

function timeSeconds(dateTime) {
  return `${dateTime.getTime()}`.substr(0, 10)
}

async function checkUptimeRobot({ messageContext }) {
  return messageContext.run(async knex => {
    const aspectDeviceTypeId = await deviceTypeToId('Aspect')

    const aspectDeviceIds = await knex('Device').where('deviceTypeId', aspectDeviceTypeId).pluck('id')

    if (!_.isEmpty(aspectDeviceIds)) {
      const now = new Date()
      const startCurrentMonth = utcDate(startOfMonth(now))
      const startOfLastMonth = utcDate(startOfMonth(subMonths(now, 1)))
      const lastMonthAndThisMonthRange = `${timeSeconds(startOfLastMonth)}_${timeSeconds(
        startCurrentMonth
      )}-${timeSeconds(startCurrentMonth)}_${timeSeconds(now)}`
      const uptimeRobotFetch = createFetch(
        method('POST'),
        base('https://api.uptimerobot.com'),
        accept('application/json'),
        header('Content-Type', 'application/x-www-form-urlencoded'),
        body(
          `api_key=${_.get(
            config,
            'uptimerobot.api.key'
          )}&format=json&custom_uptime_ranges=${lastMonthAndThisMonthRange}`
        )
      )
      try {
        const resp = await uptimeRobotFetch('/v2/getMonitors')
        if (resp.status !== 200) {
          throw new Error(`${resp.status} ${resp.statusText} ${JSON.stringify(resp)}`)
        }
        const uptimeRobotResponseJson = JSON.stringify(await resp.json())
        await Promise.each(aspectDeviceIds, async aspectDeviceId => {
          const factDeviceExternalSource = await knex('FactDeviceExternalSource')
            .where('deviceId', aspectDeviceId)
            .andWhere('sourceName', 'uptimeRobot')
            .first()
          if (factDeviceExternalSource) {
            await knex('FactDeviceExternalSource')
              .where('deviceId', aspectDeviceId)
              .andWhere('sourceName', 'uptimeRobot')
              .update({
                data: uptimeRobotResponseJson,
                updatedOn: new Date(),
              })
          } else {
            await knex('FactDeviceExternalSource').insert({
              deviceId: aspectDeviceId,
              sourceName: 'uptimeRobot',
              data: uptimeRobotResponseJson,
              updatedOn: new Date(),
            })
          }
        })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('uptimeRobot Error', err)
      }
    }
  })
}

module.exports = checkUptimeRobot
