import React, { useCallback } from 'react'
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

const DIALOG_DAILY_STATUS = 'DIALOG_DAILY_STATUS'
const initialDialogState = {
  openedDialogName: null,
}

const DailyStatus = () => {
  const minDate = getPreviousPeriod('months', 'yyyy-MM-dd').start
  const maxDate = getPreviousPeriod('months', 'yyyy-MM-dd').end
  const { formatMessage } = useIntl()
  const {
    devices: { devicesIsLoading, devicesIsError, devicesDaily, devicesError },
    statuses: {
      visibleStatuses,
      deviceStatussesIsLoading,
      deviceStatussesIsError,
      deviceStatussesError,
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
        openedDialogName: DIALOG_DAILY_STATUS,
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
    setDialogState(d => ({ ...d, openedDialogName: null }))
  }, [])

  const onDailyStatusSubmit = useCallback(({ values }) => {
    // TODO: remove console after API endpoint is ready
    // eslint-disable-next-line no-console
    console.log('>>>>>>>>> onDailyStatusSubmit', {
      values,
    })
    // close dialog
    setDialogState(d => ({ ...d, openedDialogName: null }))
  }, [])

  if (devicesIsError) {
    throw new Error(devicesError)
  }

  if (deviceStatussesIsError) {
    throw new Error(deviceStatussesError)
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
      {!devicesIsLoading && !deviceStatussesIsLoading ? (
        <div className={cssClasses('dailystatus__container')}>
          <DailyStatusFilters
            toggleAll={toggleAll}
            statusses={visibleStatuses}
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
                statusses={visibleStatuses}
                consts={GRAPH_CONSTS}
                totalDays={totalDays}
                onClickDay={onClickDay}
                deviceId={deviceId}
              />
            )
          )}

          <DailyStatusDialog
            data={dialogState.data}
            isOpen={dialogState.openedDialogName === DIALOG_DAILY_STATUS}
            onCancel={onHideDailyStatusDialog}
            onSubmit={onDailyStatusSubmit}
          />
        </div>
      ) : (
        <Loading className={cssClasses('dailystatus__spinner')} />
      )}
    </AspectCard>
  )
}

export default DailyStatus
