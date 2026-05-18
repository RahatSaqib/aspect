import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, TextField, MenuItem } from '@mui/material'
import endOfMonth from 'date-fns/endOfMonth'
import startOfMonth from 'date-fns/startOfMonth'
import subMonths from 'date-fns/subMonths'
import { useIntl } from 'react-intl'
import useDeviceMaintenanceStatus from '../../../hooks/device/useDeviceMaintenanceStatus'
import DATE_CONSTS from '../../../utils/consts/DateTime/CONSTS'
import GRAPH_CONSTS from '../../../utils/consts/Graphs/CONSTS'
import Loading from '../../Loading'
import { dateRangeOptions } from '../Helpers/Formatters'
import styles from './DailyStatus.module.css'
import DailyStatusClinic from './DailyStatusClinic'
import DailyStatusDialog from './DailyStatusDialog'
import DailyStatusFilters from './DailyStatusFilters'
import DateRanges from './DateRanges'
import useDailyStatus from './Helpers/useDailyStatus'
import messages from './messages'

const { DATE_RANGE_OPTIONS } = DATE_CONSTS

const DailyStatus = () => {
  const [dialogState, setDialogState] = useState({ isOpen: false })

  // get starting min/max dates for previous month
  const now = new Date()
  const minDate = startOfMonth(subMonths(now, 1))
  const maxDate = endOfMonth(subMonths(now, 1))

  const { formatMessage, formatDate } = useIntl()
  const {
    devices: { devicesIsLoading, devicesIsError, devicesDaily, devicesError },
    statuses: { allStatuses, visibleStatuses, deviceStatusesIsLoading, deviceStatusesIsError, deviceStatusesError },
    actions: { changeDeviceStatus, getDeviceDayDetails, toggleAll, toggleStatusVisibility, updateFromActionComponent },
    dateTime: { dateRanges, totalDays },
  } = useDailyStatus(minDate, maxDate)
  const { data: maintenanceStatuses } = useDeviceMaintenanceStatus(true)

  const ops = dateRangeOptions(formatMessage, formatDate, 'deviceDateRange').deviceDateRange

  /**
   * wrap with useCallback to keep same func reference - because
   * DailyStatusClinic is cached with React.memo
   */
  const onClickDay = useCallback(
    ({ day, deviceId }) => {
      const {
        deviceName,
        siteProps,
        periodWithSameStatus: { startedOn, endedOn, maintenanceStatusExternalId },
        note,
        expectedBackOnline,
      } = getDeviceDayDetails({ day, deviceId })
      // day clicked (formatted as "YYYY-MM-DD")
      const data = { day, startedOn, endedOn, deviceId, maintenanceStatusExternalId, note, expectedBackOnline }
      setDialogState({ isOpen: true, deviceName, siteProps, data })
    },
    [getDeviceDayDetails]
  )

  const onHideDailyStatusDialog = () => {
    setDialogState({ isOpen: false })
  }

  const onDailyStatusSubmit = ({ deviceId, values, onSuccess }) => {
    setDialogState({ isOpen: false })
    changeDeviceStatus({ deviceId, values }, { onSuccess })
  }

  if (devicesIsError) {
    throw new Error(devicesError)
  }

  if (deviceStatusesIsError) {
    throw new Error(deviceStatusesError)
  }

  const [range, setRange] = useState(DATE_RANGE_OPTIONS.LAST_MONTH)

  const onChange = e => {
    const selectedOption = ops.find(o => o.id === e.target.value)
    updateFromActionComponent({ identifier: 'dateRange', selectedOption })
    setRange(selectedOption.id)
  }
  return (
    <Card>
      <CardHeader title={formatMessage(messages.dailyStatusMainTitle)} />
      <CardContent>
        {!devicesIsLoading && !deviceStatusesIsLoading ? (
          <div className={styles.dailystatus__container}>
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
                manualStatuses={maintenanceStatuses}
              />
            ) : null}
          </div>
        ) : (
          <Loading centered />
        )}
      </CardContent>
    </Card>
  )
}

export default DailyStatus
