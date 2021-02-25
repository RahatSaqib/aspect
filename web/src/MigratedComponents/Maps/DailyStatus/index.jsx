import React, { Fragment } from 'react'
import { useIntl } from 'react-intl'
import CircularProgress from '@material-ui/core/CircularProgress'
import classnames from 'classnames/bind'
import map from 'lodash/map'
import filter from 'lodash/filter'

import variables from '../../../../cfg/variables'
import DailyStatusFilters from '../../Graphs/DailyStatus/DailyStatusFilters'
import useDailyStatus from '../../Graphs/DailyStatus/Helpers/useDailyStatus'
import AspectCard from '../../AspectCard'
import AspectMap from '../index'
import {
  dateRangeOptions,
  getTimePeriod,
} from '../../Graphs/Helpers/Formatters'
import messages from './messages'

const cssClasses = classnames.bind(require('./DailyStatusMap.css'))

const Loading = () => (
  <div className={cssClasses('dailystatusMap__spinner')}>
    <CircularProgress />
  </div>
)

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

const DailyStatusMap = () => {
  const { formatMessage } = useIntl()
  const { deviceDateRange } = dateRangeOptions('deviceDateRange')
  const minDate = deviceDateRange[1]?.value?.minDate
  const maxDate = deviceDateRange[1]?.value?.maxDate
  const {
    devices: { devicesIsLoading, devicesIsError, devicesDaily, devicesError },
    statuses: {
      visibleStatuses,
      deviceStatussesIsLoading,
      deviceStatussesIsError,
      deviceStatussesError,
    },
    actions: { toggleAll, toggleStatusVisibility },
  } = useDailyStatus(minDate, maxDate)

  if (devicesIsError) {
    throw new Error(devicesError)
  }

  if (deviceStatussesIsError) {
    throw new Error(deviceStatussesError)
  }

  const filtered = buildMarkersForDailyStatus(devicesDaily, visibleStatuses)

  const mapConfig = {
    zoom: 15,
    centre: filtered[0],
    fitMarkers: true,
    containerStyle: {
      width: '100%',
      height: '400px',
    },
    markers: {
      size: 40,
      click: () => false,
      data: filtered,
    },
    options: {
      gestureHandling: 'cooperative',
    },
  }

  return (
    <AspectCard
      title={formatMessage(messages.dailyStatusMapTitle)}
      innerSize={12}
      justify="center"
      actionComponent={false}
      name="dailyStatus"
    >
      {!devicesIsLoading && !deviceStatussesIsLoading ? (
        <Fragment>
          <DailyStatusFilters
            toggleAll={toggleAll}
            statusses={visibleStatuses}
            action={toggleStatusVisibility}
          />
          <div style={{ width: '100%', minHeight: '300px' }}>
            <AspectMap config={mapConfig} />
          </div>
        </Fragment>
      ) : (
        <Loading />
      )}
    </AspectCard>
  )
}

export default DailyStatusMap
