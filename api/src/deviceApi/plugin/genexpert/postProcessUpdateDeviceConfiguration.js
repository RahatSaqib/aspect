const _ = require('lodash')
const { updateDeviceDetails } = require('../../device')
const { macAddressValid } = require('./requestValidation')

async function postProcessUpdateDeviceConfiguration({
  knex,
  payload,
  device: { id: deviceId },
  now,
}) {
  let device = {}
  if (!_.isEmpty(_.get(payload, 'data'))) {
    const {
      data: {
        macAddress,
        hostId,
        culture,
        timezone,
        deviceSerialNumber,
        lastPingOn,
        state,
        lga,
      },
    } = payload
    const deviceDetails = {
      hostId,
      culture,
      timezone,
      lastSeenOn: new Date(lastPingOn || now),
    }
    if (macAddress && macAddressValid(macAddress)) {
      deviceDetails.macAddress = macAddress
    }
    if (lastPingOn) {
      deviceDetails.lastPingOn = new Date(lastPingOn)
    }
    if (deviceSerialNumber) {
      deviceDetails.serial = deviceSerialNumber
    }
    if (state) {
      const currentDeviceGeography = await knex('Device as d')
        .leftJoin('Site as s', 'd.siteId', 's.id')
        .innerJoin('Geography as g', function() {
          this.on('d.geographyId', 'g.id').orOn('s.geographyId', 'g.id')
        })
        .leftJoin('State as st', 'g.stateId', 'st.id')
        .leftJoin('Lga as l', 'g.lgaId', 'l.id')
        .where('d.id', deviceId)
        .first(
          'g.countryId',
          'g.stateId',
          'st.name as stateName',
          'g.lgaId',
          'l.name as lgaName',
          'd.siteId'
        )
      if (!_.isEmpty(currentDeviceGeography)) {
        let newStateId = currentDeviceGeography.stateId
        let newLgaId = currentDeviceGeography.lgaId
        if (state !== currentDeviceGeography.stateName) {
          ;[newStateId] = await knex('Geography as g')
            .join('State as s', 'g.stateId', 's.id')
            .where('g.countryId', currentDeviceGeography.countryId)
            .andWhere('s.name', state)
            .pluck('s.id')
        }
        if (newStateId && lga) {
          if (lga !== currentDeviceGeography.lgaName) {
            ;[newLgaId] = await knex('Geography as g')
              .join('Lga as l', 'g.lgaId', 'l.id')
              .where('g.stateId', newStateId)
              .andWhere('l.name', lga)
              .pluck('l.id')
          } else if (newStateId !== currentDeviceGeography.stateId) {
            newLgaId = null
          }
        }
        newStateId = newStateId || null
        newLgaId = newLgaId || null
        if (
          newStateId !== currentDeviceGeography.stateId ||
          newLgaId !== currentDeviceGeography.lgaId
        ) {
          const { id: newGeographyId } = await knex('Geography as g')
            .where({
              countryId: currentDeviceGeography.countryId,
              stateId: newStateId,
              lgaId: newLgaId,
            })
            .first('g.id')
          if (currentDeviceGeography.siteId) {
            await knex('Site')
              .where({ id: currentDeviceGeography.siteId })
              .update({ geographyId: newGeographyId })
          }
          deviceDetails.geographyId = newGeographyId
        }
      }
    }
    device = await updateDeviceDetails(
      knex,
      deviceId,
      _.omitBy(deviceDetails, _.isNil),
      now
    )
  }
  return { device }
}

module.exports = postProcessUpdateDeviceConfiguration
