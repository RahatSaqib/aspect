import React, { Fragment } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import classnames from 'classnames/bind'

import useI18n from '../../../hooks/i18n/useI18n'
import DailyStatusFilters from '../../Graphs/DailyStatus/DailyStatusFilters'
import useDailyStatus from '../../Graphs/DailyStatus/Helpers/useDailyStatus'
import { DEVICE_STATUS_LAST_REPORTED } from '../../QueryFetch/Device'
import AspectCard from '../../AspectCard'
import AspectMap from '../index'
import buildMarkersForDailyStatus from './Helpers'
import messages from './messages'

import styles from './DailyStatusMap.css'

const cssClasses = classnames.bind(styles)

const Loading = () => (
  <div className={cssClasses('dailystatusMap__spinner')}>
    <CircularProgress />
  </div>
)

const DailyStatusMap = () => {
  const { formatMessage } = useI18n()
  const {
    devices: { devicesIsLoading, devicesIsError, devicesDaily, devicesError },
    statuses: { visibleStatuses, deviceStatusesIsLoading, deviceStatusesIsError, deviceStatusesError },
    actions: { toggleAll, toggleStatusVisibility },
  } = useDailyStatus(false, false, DEVICE_STATUS_LAST_REPORTED.ENDPOINT, {
    excludeNotLocalizableDevices: true,
  })

  if (devicesIsError) {
    throw new Error(devicesError)
  }

  if (deviceStatusesIsError) {
    throw new Error(deviceStatusesError)
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
      {!devicesIsLoading && !deviceStatusesIsLoading ? (
        <Fragment>
          <DailyStatusFilters toggleAll={toggleAll} statuses={visibleStatuses} action={toggleStatusVisibility} />
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
