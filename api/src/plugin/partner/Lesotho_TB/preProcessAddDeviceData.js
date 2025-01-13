async function preProcessAddDeviceData(context) {
  const { knex, payload } = context
  const { name } = payload
  if (
    name &&
    [
      'Berea Hospital MCH',
      'Butha-Buthe Hospital MCH',
      'Likotsi Filter Clinic MCH',
      'MAFETENG HOSPITAL MCH',
      'MAKOANYANE  MILLITARY HOSPITAL MCH',
      'MALUTI SDA HOSPITAL MCH',
      'Mokhotlong Hospital MCH',
      'Motebang Hospital MCH',
      "NT'SEKHE HOSPITAL MCH",
      'Paray Hospital MCH',
      'QUTHING HOSPITAL MCH',
      'Scott Hospital MCH',
      'Seboche Hospital MCH',
      'Thamae Health Centre MCH',
    ].includes(name)
  ) {
    const hivDeviceDetails =
      (await knex('Partner as p')
        .join('Device as d', 'p.id', 'd.partnerId')
        .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .innerJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
        .leftJoin('Site as s', 'd.siteId', 's.id')
        .leftJoin('Geography as g', 's.geographyId', 'g.id')
        .leftJoin('Country as c', 'g.countryId', 'c.id')
        .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
        .where('dt.externalId', 'CepheidGeneXpert')
        .andWhere('p.name', 'Lesotho HIV')
        .first(
          'd.id',
          'd.partnerId',
          'd.siteId',
          's.geographyId',
          'd.name',
          'd.shortName',
          'd.serial',
          'd.macAddress',
          'd.configurationData',
          'd.lastSeenOn',
          'd.putInService',
          'da.token as approval',
          'dt.externalId as deviceType',
          'dt.plugin as deviceTypePluginName',
          'p.plugin as partnerPluginName',
          'dtc.name as deviceTypeCategory',
          'c.abbreviation as countryAbbreviation'
        )) || {}
    if (hivDeviceDetails) {
      context.device = hivDeviceDetails
      context.partnerId = hivDeviceDetails.partnerId
      await knex('DeviceLog').where('id', context.deviceLogId).update({ deviceId: hivDeviceDetails.id })
      if (context.partnerPluginName === 'lesothoTb') {
        context.partnerPluginName = undefined
      }
      if (hivDeviceDetails.partnerPluginName) {
        context.partnerPluginName = hivDeviceDetails.partnerPluginName
      }
    }
  }
  const { preProcessAddDeviceData: gxConnectPreProcessAddDeviceData } = require('../../deviceType/gxUtils')
  return gxConnectPreProcessAddDeviceData(context)
}

module.exports = preProcessAddDeviceData
