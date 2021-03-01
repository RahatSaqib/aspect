import { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { useIntl } from 'react-intl'

import { getIndex, getTotalDays, dateRangeByWeekDay } from './index'
import messages from '../messages'

import { extractOptionValue } from '../../Helpers/Formatters'

import fetchWrapperForQueries from '../../../QueryFetch'
import { DAILY_STATUS, DEVICE_STATUS } from '../../../QueryFetch/Device'

const useDailyStatus = (minDate, maxDate) => {
  const { formatMessage } = useIntl()
  const [statuses, setStatuses] = useState(false)
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
    isLoading: deviceStatusesIsLoading,
    isError: deviceStatusesIsError,
    error: deviceStatusesError,
  } = useQuery(
    DEVICE_STATUS.KEY,
    async () => fetchWrapperForQueries({ endpoint: DEVICE_STATUS.ENDPOINT }),
    {
      onSuccess: ({ data }) => {
        const output = []
        data.map(status => output.push({ ...status, checked: true }))
        setStatuses(output)
      },
    }
  )

  const toggleStatusVisibility = name => {
    const tempStatuses = [...visibleStatuses]
    if (name === 'all') {
      tempStatuses.map(status => (status.checked = !toggleAll.checked))
      setToggleAll({
        ...toggleAll,
        checked: !toggleAll.checked,
      })
      setVisibleStatuses(tempStatuses)
    } else {
      const index = getIndex(tempStatuses, 'i18nKey', name)
      const currentChecked = tempStatuses[index].checked
      tempStatuses[index].checked = !currentChecked
      setVisibleStatuses(tempStatuses)
    }
  }

  useEffect(() => {
    if (!visibleStatuses) {
      setVisibleStatuses(
        // do not use 'Decommissioned' for graphs
        !statuses
          ? statuses
          : statuses.filter(it => it.externalId !== 'inactiveDecommissioned')
      )
    }
  }, [statuses, visibleStatuses])

  const updateFromActionComponent = ({ identifier, selectedOption }) =>
    setParams(extractOptionValue(identifier, selectedOption))

  return {
    devices: {
      devicesIsLoading,
      devicesIsError,
      devicesDaily,
      devicesError,
    },
    statuses: {
      allStatuses: !statuses ? [] : statuses,
      visibleStatuses,
      deviceStatusesIsLoading,
      deviceStatusesIsError,
      deviceStatusesError,
    },
    actions: {
      toggleAll,
      toggleStatusVisibility,
      updateFromActionComponent,
    },
    dateTime: {
      dateRanges,
      totalDays,
    },
  }
}

export default useDailyStatus
