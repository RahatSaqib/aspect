import React, { useState } from 'react'
import classnames from 'classnames/bind'

import useI18n from '../../../hooks/useI18n'

import DailyStatusFilters from './DailyStatusFilters'
import DailyStatusClinic from './DailyStatusClinic'
import DailyStatusDialog from './DailyStatusDialog'
import DateRanges from './DateRanges'
import messages from './messages'
import GRAPH_CONSTS from '../../../globals/consts/Graphs/CONSTS'
import DATE_CONSTS from '../../../globals/consts/DateTime/CONSTS'
import Loading from '../../../oldComponents/Loading'

import { getPreviousPeriod, dateRangeOptions } from '../Helpers/Formatters'
import AspectDropDown from '../../AspectDropDown'

import AspectCard from '../../AspectCard'
import CardSelectors from '../CardSelectors'
import useDailyStatus from './Helpers/useDailyStatus'

import styles from './DailyStatus.css'

const cssClasses = classnames.bind(styles)

const { DATE_RANGE_OPTIONS } = DATE_CONSTS

const DailyStatus = () => {
  const [dialogState, setDialogState] = useState({ isOpen: false })
  const minDate = getPreviousPeriod('months', "yyyy-MM-dd'T'HH:mm:ss.SSSXXX").start
  const maxDate = getPreviousPeriod('months', "yyyy-MM-dd'T'HH:mm:ss.SSSXXX").end
  const { formatMessage } = useI18n()
  const {
    devices: { devicesIsLoading, devicesIsError, devicesDaily, devicesError },
    statuses: { allStatuses, visibleStatuses, deviceStatusesIsLoading, deviceStatusesIsError, deviceStatusesError },
    actions: { changeDeviceStatus, getDeviceDayDetails, toggleAll, toggleStatusVisibility, updateFromActionComponent },
    dateTime: { dateRanges, totalDays },
  } = useDailyStatus(minDate, maxDate)

  const onClickDay = ({ day, deviceId }) => {
    const {
      deviceName,
      siteProps,
      periodWithSameStatus: { startedOn, endedOn, maintenanceStatusExternalId },
      note,
    } = getDeviceDayDetails({ day, deviceId })
    setDialogState({
      isOpen: true,
      deviceName,
      siteProps,
      data: {
        day, // day clicked (formatted as "YYYY-MM-DD")
        startedOn,
        endedOn,
        deviceId,
        maintenanceStatusExternalId,
        note,
      },
    })
  }

  const onHideDailyStatusDialog = () => {
    setDialogState({ isOpen: false })
  }

  const onDailyStatusSubmit = ({ deviceId, values }) => {
    setDialogState({ isOpen: false })
    changeDeviceStatus({ deviceId, values })
  }

  if (devicesIsError) {
    throw new Error(devicesError)
  }

  if (deviceStatusesIsError) {
    throw new Error(deviceStatusesError)
  }

  const selectorModifiers = [
    {
      selectedValue: 'Date Range',
      endpoint: false,
      state: 'deviceDateRange',
      component: AspectDropDown,
      identifier: 'dateRange',
      data: dateRangeOptions('deviceDateRange'),
      sortByKeys: ['id'],
      isClearable: false,
      defaultSelectedOption: DATE_RANGE_OPTIONS.LAST_MONTH,
    },
  ]

  return (
    <AspectCard
      title={formatMessage(messages.dailyStatusMainTitle)}
      innerSize={12}
      justify="center"
      action={params => updateFromActionComponent({ ...params })}
      actionComponent={{
        component: CardSelectors,
        props: selectorModifiers,
      }}
      name="dailyStatus"
    >
      {!devicesIsLoading && !deviceStatusesIsLoading ? (
        <div className={cssClasses('dailystatus__container')}>
          <DailyStatusFilters toggleAll={toggleAll} statuses={visibleStatuses} action={toggleStatusVisibility} />
          <DateRanges data={dateRanges} consts={GRAPH_CONSTS} />
          {devicesDaily.map(({ id: deviceId, name, shortName, maintenanceStatusHistory, totalResults }) => (
            <DailyStatusClinic
              key={deviceId}
              name={shortName || name}
              data={maintenanceStatusHistory}
              total={totalResults}
              statuses={visibleStatuses}
              consts={GRAPH_CONSTS}
              totalDays={totalDays}
              onClickDay={onClickDay}
              deviceId={deviceId}
            />
          ))}

          <DailyStatusDialog
            data={dialogState.data}
            deviceName={dialogState.deviceName}
            siteProps={dialogState.siteProps}
            isOpen={dialogState.isOpen}
            onCancel={onHideDailyStatusDialog}
            onSubmit={onDailyStatusSubmit}
            statuses={allStatuses}
          />
        </div>
      ) : (
        <Loading className={cssClasses('dailyStatus__spinner')} />
      )}
    </AspectCard>
  )
}

export default DailyStatus
