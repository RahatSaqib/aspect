import React, { useState } from 'react'
import { Card, CardContent, CardHeader, TextField, MenuItem } from '@mui/material'
import classnames from 'classnames/bind'
import useI18n from '../../../hooks/useI18n'
import Loading from '../../../oldComponents/Loading'
import DATE_CONSTS from '../../../utils/consts/DateTime/CONSTS'
import GRAPH_CONSTS from '../../../utils/consts/Graphs/CONSTS'
import { getPreviousPeriod, dateRangeOptions } from '../Helpers/Formatters'
import styles from './DailyStatus.css'
import DailyStatusClinic from './DailyStatusClinic'
import DailyStatusDialog from './DailyStatusDialog'
import DailyStatusFilters from './DailyStatusFilters'
import DateRanges from './DateRanges'
import useDailyStatus from './Helpers/useDailyStatus'
import messages from './messages'

const cssClasses = classnames.bind(styles)

const { DATE_RANGE_OPTIONS } = DATE_CONSTS

const ops = dateRangeOptions('deviceDateRange').deviceDateRange

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
    // day clicked (formatted as "YYYY-MM-DD")
    const data = { day, startedOn, endedOn, deviceId, maintenanceStatusExternalId, note }
    setDialogState({ isOpen: true, deviceName, siteProps, data })
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

  const [range, setRange] = useState(DATE_RANGE_OPTIONS.LAST_MONTH)

  const onChange = e => {
    const selectedOption = ops.filter(o => o.id === e.target.value)[0]
    updateFromActionComponent({ identifier: 'dateRange', selectedOption })
    setRange(selectedOption.id)
  }

  return (
    <Card>
      <CardHeader title={formatMessage(messages.dailyStatusMainTitle)} />
      <CardContent>
        {!devicesIsLoading && !deviceStatusesIsLoading ? (
          <div className={cssClasses('dailystatus__container')}>
            <TextField select value={range} onChange={onChange} sx={{ float: 'right', width: '240px' }}>
              {ops.map(c => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
            <DailyStatusFilters toggleAll={toggleAll} statuses={visibleStatuses} action={toggleStatusVisibility} />
            <DateRanges data={dateRanges} consts={GRAPH_CONSTS} />
            {devicesDaily.map(({ id: deviceId, name, maintenanceStatusHistory, totalResults }) => (
              <DailyStatusClinic
                key={deviceId}
                name={name}
                data={maintenanceStatusHistory}
                total={totalResults}
                statuses={visibleStatuses}
                consts={GRAPH_CONSTS}
                totalDays={totalDays}
                onClickDay={onClickDay}
                deviceId={deviceId}
              />
            ))}

            {dialogState.isOpen ? (
              <DailyStatusDialog
                data={dialogState.data}
                deviceName={dialogState.deviceName}
                siteProps={dialogState.siteProps}
                onCancel={onHideDailyStatusDialog}
                onSubmit={onDailyStatusSubmit}
                statuses={allStatuses}
              />
            ) : null}
          </div>
        ) : (
          <Loading className={cssClasses('dailyStatus__spinner')} />
        )}
      </CardContent>
    </Card>
  )
}

export default DailyStatus
