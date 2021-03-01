import React from 'react'
import classnames from 'classnames/bind'
import CircularProgress from '@material-ui/core/CircularProgress'
import { useIntl } from 'react-intl'

import DailyStatusFilters from './DailyStatusFilters'
import DailyStatusClinic from './DailyStatusClinic'
import DateRanges from './DateRanges'
import messages from './messages'
import GRAPH_CONSTS from '../../../globals/consts/Graphs/CONSTS'
import DATE_CONSTS from '../../../globals/consts/DateTime/CONSTS'

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

const Loading = () => (
  <div className={cssClasses('dailystatus__spinner')}>
    <CircularProgress />
  </div>
)

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
            ({ name, shortName, maintenanceStatusHistory, totalResults }) => (
              <DailyStatusClinic
                name={shortName || name}
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
