require('isomorphic-fetch')
const {
  createFetch,
  base,
  accept,
  header,
  method,
  body,
} = require('http-client')
const { subMonths, startOfMonth } = require('date-fns')

const config = require('../../config')
const { deviceTypeToId } = require('../../shared/dictionary')
const {
  getUtcTime,
  formatDateOrDefault,
  parseDateOrDefault,
} = require('../../shared/date')

function utcDate(localDateTime) {
  return parseDateOrDefault(
    `${formatDateOrDefault(localDateTime, 'yyyy-MM-dd')}T00:00:00.000Z`
  )
}

function timeSeconds(dateTime) {
  return `${dateTime.getTime()}`.substr(0, 10)
}

module.exports = async function ({ messageContext }) {
  return messageContext.run(async knex => {
    const { id: aspectDeviceId } =
      (await knex('Device')
        .where('deviceTypeId', await deviceTypeToId('Aspect'))
        .first('id')) || {}
    if (aspectDeviceId) {
      const now = new Date()
      const startCurrentMonth = utcDate(startOfMonth(now))
      const startOfLastMonth = utcDate(startOfMonth(subMonths(now, 1)))

      const uptimeRobotFetch = createFetch(
        method('POST'),
        base('https://api.uptimerobot.com'),
        accept('application/json'),
        header('Content-Type', 'application/x-www-form-urlencoded'),
        body(
          `api_key=${
            config.uptimerobot.api.key
          }&format=json&custom_uptime_ranges=${timeSeconds(
            startOfLastMonth
          )}_${timeSeconds(startCurrentMonth)}-${timeSeconds(
            startCurrentMonth
          )}_${timeSeconds(now)}`
        )
      )

      try {
        const resp = await uptimeRobotFetch('/v2/getMonitors')
        if (resp.status !== 200) {
          throw new Error(
            `${resp.status} ${resp.statusText} ${JSON.stringify(resp)}`
          )
        }
        const factDeviceExternalSource = await knex('FactDeviceExternalSource')
          .where('deviceId', aspectDeviceId)
          .andWhere('sourceName', 'uptimeRobot')
          .first()
        if (factDeviceExternalSource) {
          await knex('FactDeviceExternalSource')
            .where('deviceId', aspectDeviceId)
            .andWhere('sourceName', 'uptimeRobot')
            .update({
              data: JSON.stringify(await resp.json()),
              updatedOn: getUtcTime(),
            })
        } else {
          await knex('FactDeviceExternalSource').insert({
            deviceId: aspectDeviceId,
            sourceName: 'uptimeRobot',
            data: JSON.stringify(await resp.json()),
            updatedOn: getUtcTime(),
          })
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('uptimeRobot Error', err)
      }
    }
  })
}
