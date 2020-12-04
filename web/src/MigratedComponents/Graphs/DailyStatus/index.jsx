import React, { Fragment, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useQuery } from 'react-query'
import classnames from 'classnames/bind'
import CircularProgress from '@material-ui/core/CircularProgress'
import Checkbox from '@material-ui/core/Checkbox'
import FormGroup from '@material-ui/core/FormGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'

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

import Shell from '../../Shell'
import ShellHeader from '../../Shell/Header'
import ShellContent from '../../Shell/Content'
import AspectTooltip from '../../../components/shared/AspectTooltip'
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

const groupDateRanges = data => {
  const output = []
  const dateFormat = 'd/M'
  _.map(data, (v, k) => {
    const min = format(_.first(v), dateFormat)
    const max = v.length > 1 ? format(_.last(v), dateFormat) : false
    return output.push({ week: k, min, max, size: v.length })
  })
  return output
}

function dateRangeByWeekDay(startOfMonth) {
  const amountOfDays = _.range(0, getDaysInMonth(startOfMonth))
  return amountOfDays.reduce((acc, curr) => {
    const thisDay = addDays(startOfMonth, curr)
    const weekInt = getWeek(thisDay, { weekStartsOn: 1 })
    const weekIndicator = isWeekend(thisDay) ? `${weekInt}_we` : `${weekInt}_wd`
    if (!acc[weekIndicator]) {
      acc[weekIndicator] = []
    }
    acc[weekIndicator].push(thisDay)
    return acc
  }, {})
}

const Loading = () => (
  <div className={cssClasses('dailystatus__spinner')}>
    <CircularProgress />
  </div>
)

const DailyStatusFilters = ({ toggleAll, statusses, action }) => {
  return (
    <div className={cssClasses('statusses__row')}>
      <div className={cssClasses('statusses__spacer')} />
      <div className={cssClasses('statusses__container')}>
        <FormGroup row>
          <div className={cssClasses('statusses__status')}>
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  checked={toggleAll.checked}
                  onChange={() => action(toggleAll.key)}
                  value={toggleAll.key}
                />
              }
              label="Toggle All"
            />
          </div>
        </FormGroup>
        <FormGroup row>
          <div className={cssClasses('statusses__status')}>
            {statusses
              ? statusses.map(({ externalId, name, checked }) => (
                  <FormControlLabel
                    classes={{
                      root: cssClasses('statusses__statusroot'),
                      label: cssClasses('statusses__statuslabel'),
                    }}
                    control={
                      <Checkbox
                        color="primary"
                        checked={checked}
                        onChange={() => action(externalId)}
                        value={externalId}
                      />
                    }
                    label={name}
                  />
                ))
              : null}
          </div>
        </FormGroup>
      </div>
    </div>
  )
}

const DateRanges = ({ data }) => {
  const days = groupDateRanges(data)
  const {
    blockSize: { width: blockWidth, marginWidth },
    totalBlockSize: { width: totalBlockWidth },
  } = CONSTS
  return (
    <div className={cssClasses('dates__row')}>
      <div className={cssClasses('dates__spacer')} />
      <div className={cssClasses('dates__dayContainer')}>
        {days.map(({ min, max, week, size }) => {
          return week.includes('we') ? (
            <div
              className={cssClasses('dates__dayBlock')}
              style={{
                width: `${(blockWidth + marginWidth) * size}px`,
              }}
            />
          ) : (
            <div
              className={cssClasses('dates__dayBlock')}
              style={{
                width: `${(blockWidth + marginWidth) * size}px`,
              }}
            >
              {min}
              {max ? ` - ${max}` : null}
            </div>
          )
        })}
        <div
          className={cssClasses('dates__dayBlock')}
          style={{
            width: `${totalBlockWidth}px`,
          }}
        >
          Tests
        </div>
      </div>
    </div>
  )
}

const ClinicDay = ({
  isWeekend,
  maintenanceStatusI18nKey,
  daysInSameStatus,
  statusses,
}) => {
  const {
    blockSize: { width: blockWidth, height: blockHeight, marginWidth },
    weekend,
  } = CONSTS

  const { checked } =
    _.filter(statusses, {
      i18nKey: maintenanceStatusI18nKey,
    })[0] || false

  let dayModifier = isWeekend ? weekend : null
  if (checked) {
    dayModifier =
      maintenanceStatusI18nKey === 'active' ||
      maintenanceStatusI18nKey === 'reportedActive'
        ? maintenanceStatusI18nKey
        : isWeekend
        ? weekend
        : maintenanceStatusI18nKey
  }

  const DayBlock = () => (
    <div
      className={cssClasses('clinic__day', `clinic__day--${dayModifier}`)}
      style={{
        width: `${blockWidth}px`,
        height: `${blockHeight}px`,
        margin: `0 ${marginWidth / 2}px`,
      }}
    />
  )

  return checked && daysInSameStatus ? (
    <AspectTooltip
      title={`${daysInSameStatus} Days since last update`}
      toolTipContainerClass="inline__tooltip"
      placement="right"
    >
      <DayBlock />
    </AspectTooltip>
  ) : (
    <DayBlock />
  )
}

const Clinic = ({ name, data, total, statusses }) => {
  const {
    blockSize: { height: blockHeight, marginWidth },
    totalBlockSize: { width: totalBlockWidth },
  } = CONSTS
  return (
    <div className={cssClasses('clinic__container')}>
      <div className={cssClasses('clinic__name')}>{name}</div>
      <div className={cssClasses('clinic__dayrow')}>
        {data.map(
          ({ isWeekend, maintenanceStatusI18nKey, daysInSameStatus }) => (
            <ClinicDay
              isWeekend={isWeekend}
              maintenanceStatusI18nKey={maintenanceStatusI18nKey}
              daysInSameStatus={daysInSameStatus}
              statusses={statusses}
            />
          )
        )}
        <div
          className={cssClasses('clinic__testtotal')}
          style={{
            minWidth: totalBlockWidth,
            height: blockHeight,
            margin: `0 ${marginWidth / 2}px`,
          }}
        >
          {total}
        </div>
      </div>
    </div>
  )
}

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
            <DateRanges data={dateRanges} />
            {devicesDaily.map(
              ({ name, maintenanceStatusHistory, totalResults }) => (
                <Clinic
                  name={name}
                  data={maintenanceStatusHistory}
                  total={totalResults}
                  statusses={visibleStatuses}
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
