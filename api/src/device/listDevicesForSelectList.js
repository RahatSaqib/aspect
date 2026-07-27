const { knex, filterParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { INTERNAL_DEVICE_IDS } = require('../shared/constants')

/**
 * Returns a list of devices for select list, with optional filters.
 * @param {Object} request - The request object containing query and auth.
 */
async function listDevicesForSelectList(request) {
  const {
    query,
    query: { showUndeployedDevices, showDecommissionedDevices, onlyResultDevices, deviceTypeExternalId },
    auth,
  } = request
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  // Translate the wire-level flags into the deviceApprovals token set
  const deviceApprovals = ['approved']
  if (showUndeployedDevices) deviceApprovals.push('pendingDeployment')
  if (showDecommissionedDevices) deviceApprovals.push('decommissioned')

  const devicesQuery = knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
    .leftJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .modify(addConstraints, dataConstraints, { device: 'd', geography: 'g' }, { deviceApprovals })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      partnerId: 'd.partnerId',
      siteId: 'd.siteId',
    })
    .whereNotIn('dt.externalId', INTERNAL_DEVICE_IDS)
    .modify(qb => {
      if (deviceTypeExternalId) {
        qb.where('dt.externalId', deviceTypeExternalId)
      }
    })
    .orderBy(['d.name'], 'asc')
    .select(
      'd.id',
      'd.name',
      'd.serial as deviceSerial',
      'd.siteId',
      'd.deviceTypeId',
      'dt.name as deviceType',
      's.name as siteName'
    )
  if (onlyResultDevices) {
    devicesQuery.where('dtc.hasResults', 1)
  }

  const devices = await devicesQuery
  return { ok: true, data: devices }
}

module.exports = { listDevicesForSelectList }
