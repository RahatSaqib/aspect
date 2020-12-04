import React, { Fragment, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useQuery } from 'react-query'
import classnames from 'classnames/bind'
import CircularProgress from '@material-ui/core/CircularProgress'

// eslint-disable-next-line lodash/import-scope
import _ from 'lodash'
import {
  isWeekend,
  addDays,
  format,
  startOfWeek,
  getDaysInMonth,
  getWeeksInMonth,
  getWeek,
  isValid,
} from 'date-fns'

import { groupDateRanges, dateRangeByWeekDay } from './Helpers'
import DailyStatusFilters from './DailyStatusFilters'
import DailyStatusClinic from './DailyStatusClinic'
import DateRanges from './DateRanges'

import Shell from '../../Shell'
import ShellHeader from '../../Shell/Header'
import ShellContent from '../../Shell/Content'

import fetchWrapperForQueries from '../../QueryFetch'
import { DAILY_STATUS, DEVICE_STATUS } from '../../QueryFetch/Device'

const CONSTS = {
  weekend: 'weekend',
  blockSize: {
    width: 19,
    height: 15,
    marginWidth: 6,
  },
  totalBlockSize: {
    width: 55,
  },
}

const cssClasses = classnames.bind(require('./DailyStatus.css'))

const Loading = () => (
  <div className={cssClasses('dailystatus__spinner')}>
    <CircularProgress />
  </div>
)

const DailyStatus = () => {
  const [statusses, setStatusses] = useState(false)
  const [visibleStatuses, setVisibleStatuses] = useState(false)
  const [toggleAll, setToggleAll] = useState(false)
  const params = { minDate: '2020-11-01', maxDate: '2020-11-30' }
  const startOfMonth = new Date(params.minDate)
  const dateRanges = dateRangeByWeekDay(startOfMonth)

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
    if (name === 'all') {
      const tempStatusses = [...visibleStatuses]
      tempStatusses.map(status => (status.checked = !toggleAll.checked))
      setToggleAll({
        ...toggleAll,
        checked: !toggleAll.checked,
      })
      setVisibleStatuses(tempStatusses)
    } else {
      const tempStatusses = [...visibleStatuses]
      const index = _.findIndex(tempStatusses, { i18nKey: name })
      const currentChecked = tempStatusses[index].checked
      tempStatusses[index].checked = !currentChecked
      setVisibleStatuses(tempStatusses)
    }
  }

  useEffect(() => {
    if (!visibleStatuses) {
      setToggleAll({
        checked: true,
        label: 'toggleAll',
        key: 'all',
      })
      setVisibleStatuses(statusses)
    }
  }, [statusses, visibleStatuses])

  if (devicesIsError) {
    throw new Error(devicesError)
  }

  if (deviceStatussesIsError) {
    throw new Error(deviceStatussesError)
  }

  return (
    <Shell>
      <ShellContent>
        {!devicesIsLoading && visibleStatuses ? (
          <Fragment>
            <DailyStatusFilters
              toggleAll={toggleAll}
              statusses={visibleStatuses}
              action={toggleStatusVisibility}
            />
            <DateRanges data={dateRanges} consts={CONSTS} />
            {devicesDaily.map(
              ({ name, maintenanceStatusHistory, totalResults }) => (
                <DailyStatusClinic
                  name={name}
                  data={maintenanceStatusHistory}
                  total={totalResults}
                  statusses={visibleStatuses}
                  consts={CONSTS}
                />
              )
            )}
          </Fragment>
        ) : (
          <Loading />
        )}
      </ShellContent>
    </Shell>
  )
}

export default DailyStatus
