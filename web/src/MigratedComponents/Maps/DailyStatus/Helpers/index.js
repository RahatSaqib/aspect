import map from 'lodash/map'
import filter from 'lodash/filter'

import variables from '../../../../../cfg/variables'
import { getTimePeriod } from '../../../Graphs/Helpers/Formatters'

const buildMarkersForDailyStatus = (data, statuses) => {
  const { customPropertiesVariables } = variables
  const visible = map(filter(statuses, 'checked'), 'i18nKey')
  const yesterday = getTimePeriod(1, 'days', 'yyyy-MM-dd')
  const output = []
  map(data, ({ maintenanceStatusHistory, latitude, longitude, ...rest }) => {
    const maintenanceStatus = filter(
      maintenanceStatusHistory,
      ({ day, maintenanceStatusExternalId }) => {
        return (
          day === yesterday && visible.includes(maintenanceStatusExternalId)
        )
      }
    )
    return maintenanceStatus.length
      ? output.push({
          lat: latitude,
          lng: longitude,
          ...rest,
          ...maintenanceStatus[0],
          color:
            customPropertiesVariables[
              `--aspect-device-${maintenanceStatus[0].maintenanceStatusI18nKey}`
            ],
        })
      : false
  })

  return output
}

export default buildMarkersForDailyStatus
