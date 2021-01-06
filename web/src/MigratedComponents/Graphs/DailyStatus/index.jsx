import React, { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import classnames from 'classnames/bind'
import CircularProgress from '@material-ui/core/CircularProgress'
import { useIntl } from 'react-intl'

import { getIndex, getTotalDays, dateRangeByWeekDay } from './Helpers'
import DailyStatusFilters from './DailyStatusFilters'
import DailyStatusClinic from './DailyStatusClinic'
import DateRanges from './DateRanges'
import messages from './messages'
import GRAPH_CONSTS from '../../../globals/consts/Graphs/CONSTS'
import DATE_CONSTS from '../../../globals/consts/DateTime/CONSTS'

import {
  getPreviousPeriod,
  dateRangeOptions,
  extractOptionValue,
} from '../Helpers/Formatters'
import AspectDropdown from '../../AspectDropdown'

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
    component: AspectDropdown,
    identifier: 'dateRange',
    data: dateRangeOptions('deviceDateRange'),
    sortByKeys: ['id'],
    isClearable: false,
    defaultSelectedOption: DATE_RANGE_OPTIONS.LAST_MONTH,
  },
]

const Loading = () => (
  <div className={cssClasses('dailystatus__spinner')}>
    <CircularProgress />
  </div>
)

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
  const startOfMonth = new Date(params.minDate)
  const endOfPeriodDate = new Date(params.maxDate)
  const dateRanges = dateRangeByWeekDay(startOfMonth, endOfPeriodDate)
  const totalDays = getTotalDays(params)

  const {
    isLoading: devicesIsLoading,
    isError: devicesIsError,
    data: { data: devicesDaily } = false,
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
            ({ name, maintenanceStatusHistory, totalResults }) => (
              <DailyStatusClinic
                name={name}
                data={maintenanceStatusHistory}
                total={totalResults}
                statusses={visibleStatuses}
                consts={GRAPH_CONSTS}
                totalDays={totalDays}
              />
            )
          )}
        </div>
      ) : (
        <Loading />
      )}
    </AspectCard>
  )
}

export default DailyStatus
