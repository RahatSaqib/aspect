async function preProcessAddDeviceData(context) {
  const { auth, knex, payload } = context
  const { externalId: deviceTypeId } =
    (await knex('DeviceApiKey as dak')
      .join('Device as d', 'dak.deviceId', 'd.id')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .where('dak.token', auth.credentials.token)
      .first('dt.externalId')) || {}
  if (deviceTypeId === 'GxAlert') {
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
      const hivGxAlertDeviceApiKey =
        (await knex('DeviceApiKey as dak')
          .join('Device as d', 'dak.deviceId', 'd.id')
          .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
          .join('Partner as p', 'dak.partnerId', 'p.id')
          .where('dt.externalId', 'GxAlert')
          .andWhere('p.name', 'Lesotho HIV')
          .first('dak.*')) || {}
      context.auth.credentials.token = hivGxAlertDeviceApiKey.token
    }
    const gxAlertPreProcessAddDeviceData = require('../../deviceType/GxAlert/preProcessAddDeviceData')
    return gxAlertPreProcessAddDeviceData(context)
  }
}

module.exports = preProcessAddDeviceData
