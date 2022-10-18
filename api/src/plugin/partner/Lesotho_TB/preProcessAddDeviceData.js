async function preProcessAddDeviceData(context) {
  const {
    device: { deviceType },
    knex,
    payload,
  } = context
  if (deviceType === 'GxAlert') {
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
      const hivGxAlertDeviceDetails =
        (await knex('Partner as p')
          .join('Device as d', 'p.id', 'd.partnerId')
          .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
          .innerJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
          .leftJoin('Geography as g', 'd.geographyId', 'g.id')
          .leftJoin('Country as c', 'g.countryId', 'c.id')
          .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
          .where('dt.externalId', 'GxAlert')
          .andWhere('p.name', 'Lesotho HIV')
          .first(
            'd.id',
            'd.partnerId',
            'd.siteId',
            'd.geographyId',
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
      if (hivGxAlertDeviceDetails) {
        context.device = hivGxAlertDeviceDetails
        context.partnerId = hivGxAlertDeviceDetails.partnerId
        await knex('DeviceLog').where('id', context.deviceLogId).update({ deviceId: hivGxAlertDeviceDetails.id })
        const indexOfLesothoTbPluginName = context.pluginNames.indexOf('lesothoTb')
        if (indexOfLesothoTbPluginName) {
          context.pluginNames.splice(indexOfLesothoTbPluginName, 1)
        }
        if (hivGxAlertDeviceDetails.partnerPluginName) {
          context.pluginNames = [hivGxAlertDeviceDetails.partnerPluginName, ...context.pluginNames]
        }
      }
    }
    const gxAlertPreProcessAddDeviceData = require('../../deviceType/GxAlert/preProcessAddDeviceData')
    return gxAlertPreProcessAddDeviceData(context)
  }
}

module.exports = preProcessAddDeviceData
