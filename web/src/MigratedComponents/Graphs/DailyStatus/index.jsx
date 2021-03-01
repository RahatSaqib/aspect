import React, { useCallback, useState } from 'react'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'
import findIndex from 'lodash/findIndex'
import findLastIndex from 'lodash/findLastIndex'

import DailyStatusFilters from './DailyStatusFilters'
import DailyStatusClinic from './DailyStatusClinic'
import DailyStatusDialog from './DailyStatusDialog'
import DateRanges from './DateRanges'
import messages from './messages'
import GRAPH_CONSTS from '../../../globals/consts/Graphs/CONSTS'
import DATE_CONSTS from '../../../globals/consts/DateTime/CONSTS'
import Loading from '../../../globals/components/Loading'

import { getPreviousPeriod, dateRangeOptions } from '../Helpers/Formatters'
import AspectDropDown from '../../AspectDropDown'

import AspectCard from '../../AspectCard'
import CardSelectors from '../CardSelectors'
import useDailyStatus from './Helpers/useDailyStatus'

const cssClasses = classnames.bind(require('./DailyStatus.css'))

const { DATE_RANGE_OPTIONS } = DATE_CONSTS
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

const DailyStatus = () => {
  const [dialogState, setDialogState] = useState({ isOpen: false })
  const minDate = getPreviousPeriod('months', 'yyyy-MM-dd').start
  const maxDate = getPreviousPeriod('months', 'yyyy-MM-dd').end
  const { formatMessage } = useIntl()
  const {
    devices: { devicesIsLoading, devicesIsError, devicesDaily, devicesError },
    statuses: {
      allStatuses,
      visibleStatuses,
      deviceStatusesIsLoading,
      deviceStatusesIsError,
      deviceStatusesError,
    },
    actions: { toggleAll, toggleStatusVisibility, updateFromActionComponent },
    dateTime: { dateRanges, totalDays },
  } = useDailyStatus(minDate, maxDate)

  const onClickDay = useCallback(
    ({ day, deviceId }) => {
      const { maintenanceStatusHistory } = devicesDaily.find(
        ({ id }) => id === deviceId
      )
      const {
        isWeekend,
        maintenanceStatusExternalId,
      } = maintenanceStatusHistory.find(it => it.day === day)
      const fromIndex = maintenanceStatusHistory.findIndex(it => it.day === day)
      // helper to get forward or backward index of first day with another status
      const getIndex = findFn =>
        findFn(
          maintenanceStatusHistory,
          it =>
            it.maintenanceStatusExternalId !== maintenanceStatusExternalId ||
            it.isWeekend !== isWeekend,
          fromIndex
        )

      const startedOnIndex = getIndex(findLastIndex) + 1
      let endedOnIndex = getIndex(findIndex)
      endedOnIndex =
        endedOnIndex === -1
          ? maintenanceStatusHistory.length - 1
          : endedOnIndex - 1
      const startedOn = maintenanceStatusHistory[startedOnIndex].day
      const endedOn = maintenanceStatusHistory[endedOnIndex].day

      setDialogState({
        isOpen: true,
        data: {
          day, // day clicked (formatted as "YYYY-MM-DD")
          startedOn,
          endedOn,
          deviceId,
          maintenanceStatusExternalId,
        },
      })
    },
    [devicesDaily]
  )

  const onHideDailyStatusDialog = useCallback(() => {
    setDialogState({ isOpen: false })
  }, [])

  const onDailyStatusSubmitted = useCallback(() => {
    setDialogState({ isOpen: false })

    // values, deviceId
  }, [])

  if (devicesIsError) {
    throw new Error(devicesError)
  }

  if (deviceStatusesIsError) {
    throw new Error(deviceStatusesError)
  }

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
          <DailyStatusFilters
            toggleAll={toggleAll}
            statuses={visibleStatuses}
            action={toggleStatusVisibility}
          />
          <DateRanges data={dateRanges} consts={GRAPH_CONSTS} />
          {devicesDaily.map(
            ({
              id: deviceId,
              name,
              shortName,
              maintenanceStatusHistory,
              totalResults,
            }) => (
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
            )
          )}

          <DailyStatusDialog
            data={dialogState.data}
            isOpen={dialogState.isOpen}
            onCancel={onHideDailyStatusDialog}
            onSubmit={onDailyStatusSubmitted}
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
