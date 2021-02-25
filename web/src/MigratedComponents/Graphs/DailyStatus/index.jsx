import React, { useCallback, useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'
import findIndex from 'lodash/findIndex'
import findLastIndex from 'lodash/findLastIndex'

import { getIndex, getTotalDays, dateRangeByWeekDay } from './Helpers'
import DailyStatusFilters from './DailyStatusFilters'
import DailyStatusClinic from './DailyStatusClinic'
import DailyStatusDialog from './DailyStatusDialog'
import DateRanges from './DateRanges'
import messages from './messages'
import GRAPH_CONSTS from '../../../globals/consts/Graphs/CONSTS'
import DATE_CONSTS from '../../../globals/consts/DateTime/CONSTS'
import Loading from '../../../globals/components/Loading'

import {
  getPreviousPeriod,
  dateRangeOptions,
  extractOptionValue,
} from '../Helpers/Formatters'
import AspectDropDown from '../../AspectDropDown'

import AspectCard from '../../AspectCard'
import CardSelectors from '../CardSelectors'

import fetchWrapperForQueries from '../../QueryFetch'
import { DAILY_STATUS, DEVICE_STATUS } from '../../QueryFetch/Device'

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
  const [statusses, setStatusses] = useState(false)
  const [visibleStatuses, setVisibleStatuses] = useState(false)
  const [toggleAll, setToggleAll] = useState({
    checked: true,
    label: formatMessage(messages.dailyStatusToggleAll),
    key: 'all',
  })
  const [params, setParams] = useState({ minDate, maxDate })
  const [dialogState, setDialogState] = useState(initialDialogState)

  const startOfMonth = new Date(params.minDate)
  const endOfPeriodDate = new Date(params.maxDate)
  const dateRanges = dateRangeByWeekDay(startOfMonth, endOfPeriodDate)
  const totalDays = getTotalDays(params)

  const {
    isLoading: devicesIsLoading,
    isError: devicesIsError,
    data: { data: devicesDaily = [] } = false,
    error: devicesError,
  } = useQuery([DAILY_STATUS.KEY, { params }], async (key, { params }) =>
    fetchWrapperForQueries({
      endpoint: DAILY_STATUS.ENDPOINT,
      params,
    })
  )

  const {
    isLoading: deviceStatussesIsLoading,
    isError: deviceStatussesIsError,
    error: deviceStatussesError,
  } = useQuery(
    DEVICE_STATUS.KEY,
    async () => fetchWrapperForQueries({ endpoint: DEVICE_STATUS.ENDPOINT }),
    {
      onSuccess: ({ data }) => {
        const output = []
        data.map(status => output.push({ ...status, checked: true }))
        setStatusses(output)
      },
    }
  )

  const toggleStatusVisibility = name => {
    const tempStatusses = [...visibleStatuses]
    if (name === 'all') {
      tempStatusses.map(status => (status.checked = !toggleAll.checked))
      setToggleAll({
        ...toggleAll,
        checked: !toggleAll.checked,
      })
      setVisibleStatuses(tempStatusses)
    } else {
      const index = getIndex(tempStatusses, 'i18nKey', name)
      const currentChecked = tempStatusses[index].checked
      tempStatusses[index].checked = !currentChecked
      setVisibleStatuses(tempStatusses)
    }
  }

  useEffect(() => {
    if (!visibleStatuses) {
      setVisibleStatuses(statusses)
    }
  }, [statusses, visibleStatuses])

  const updateFromActionComponent = ({ identifier, selectedOption }) =>
    setParams(extractOptionValue(identifier, selectedOption))

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
