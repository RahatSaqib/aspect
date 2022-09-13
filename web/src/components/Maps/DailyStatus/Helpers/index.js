import filter from 'lodash/filter'
import map from 'lodash/map'
import variables from '../../../../theme/colors'

const buildMarkersForDailyStatus = (data, statuses) => {
  const { customPropertiesVariables } = variables
  const visible = map(filter(statuses, 'checked'), 'i18nKey')
  const output = []
  map(
    filter(data, item => visible.includes(item.maintenanceStatusExternalId)),
    ({ maintenanceStatusExternalId, latitude, longitude, ...rest }) =>
      output.push({
        lat: latitude,
        lng: longitude,
        ...rest,
        maintenanceStatusExternalId,
        color: customPropertiesVariables[`--aspect-device-${maintenanceStatusExternalId}`],
      })
  )

  return output
}

export default buildMarkersForDailyStatus
