const { knex } = require('../db')

async function getStatistics() {
  const stats = {}

  const baseColumns = ['c.id as CountryId', 'c.name AS Country', 'c.abbreviation AS A2', 'c.a3 as A3']

  /**
   * see stored procedure `GetAdoptionCountries` in GxAlert
   */
  stats.Countries = await knex('Country as c')
    .innerJoin('Geography as g', 'c.id', 'g.countryId')
    .innerJoin('Site as s', 'g.id', 's.geographyId')
    .innerJoin('Device as d', 's.id', 'd.siteId')
    .groupBy('c.name')
    .select([...baseColumns, knex.raw(`DATE_FORMAT(MIN(d.createdOn), '%Y-%m-1') AS Date`)])
    .count({
      Total: knex.raw(`DISTINCT d.id`),
    })
    .orderBy(knex.raw('MIN(d.createdOn)'))

  /**
   * see stored procedure `GetAdoptionDeployments` in GxAlert
   */
  stats.Devices = await knex('Device as d')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('Country as c', 'g.countryId', 'c.id')
    .select([...baseColumns, knex.raw(`DATE_FORMAT(d.createdOn, '%Y-%m-1') AS Date`)])
    .count({
      Total: knex.raw(`DISTINCT d.id`),
    })
    .groupBy('c.name', 'Date')
    .orderBy('c.name', 'Date')

  /**
   * see stored procedure `GetAdoptionNotifications` in GxAlert
   */
  stats.Notifications = await knex('Notification as n')
    .innerJoin('NotificationType as nt', 'n.notificationTypeId', 'nt.id')
    .innerJoin('NotificationTypeCategory as ntc', 'nt.notificationTypeCategoryId', 'ntc.id')
    .innerJoin('Result as r', 'n.resultId', 'r.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Geography as g', 'd.geographyId', 'g.id')
    .innerJoin('Country as c', 'g.countryId', 'c.id')
    .whereIn('ntc.externalId', ['resultBased'])
    .where(qb => {
      qb.whereNotNull('n.emailMessageId').orWhereNotNull('n.smsMessageId')
    })
    .whereNotNull('c.id')
    .select([...baseColumns, knex.raw(`DATE_FORMAT(n.createdOn, '%Y-%m-1') AS Date`)])
    .count({
      Total: knex.raw(`DISTINCT n.id`),
      Sms: knex.raw(`
        DISTINCT
        CASE
          WHEN n.smsMessageId IS NOT NULL
          THEN n.id
          ELSE null
        END
      `),
      Email: knex.raw(`
        DISTINCT
        CASE
          WHEN n.emailMessageId IS NOT NULL
          THEN n.id
          ELSE null
        END
      `),
    })
    .groupBy('c.name', 'Date')
    .orderBy('c.name', 'Date')

  /**
   * see stored procedure `GetAdoptionTests` in GxAlert
   */
  stats.Tests = await knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Geography as g', 'd.geographyId', 'g.id')
    .innerJoin('Country as c', 'g.countryId', 'c.id')
    .select([...baseColumns, knex.raw(`DATE_FORMAT(r.endedOn, '%Y-%m-1') AS Date`)])
    .count({
      Total: knex.raw(`DISTINCT r.id`),
    })
    .groupBy('c.name', 'Date')
    .orderBy('c.name', 'Date')

  /**
   * see stored procedure `GetAdoptionConnectivity` in GxAlert
   */
  stats.Connectivity = await knex('Device as d')
    .innerJoin('Geography as g', 'd.geographyId', 'g.id')
    .innerJoin('Country as c', 'g.countryId', 'c.id')
    .leftOuterJoin('DeviceMaintenanceStatusLog as dml', 'd.deviceMaintenanceStatusLogId', 'dml.id')
    .leftOuterJoin('DeviceMaintenanceStatus as dms', 'dml.deviceMaintenanceStatusId', 'dms.id')
    /**
     * Use only devices with results.
     * This corresponds with condition
     * `WHERE d.DeploymentId IN (SELECT DISTINCT DeploymentId FROM test)`
     * from stored procedure `GetAdoptionConnectivity` in GxAlert
     */
    .innerJoin('Result as r0', 'd.id', 'r0.deviceId')
    .select([
      ...baseColumns,
      knex.raw('GREATEST(d.lastPingOn, d.lastSeenOn) as Date'),
      'dms.id as MaintenanceStatusId',
      'dms.i18nKey as MaintenanceReasonId',
    ])
    .groupBy('d.id')

  return stats
}

module.exports = { getStatistics }
