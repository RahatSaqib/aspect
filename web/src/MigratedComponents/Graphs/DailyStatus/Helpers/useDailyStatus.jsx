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
        setStatusses(
          output.filter(it => it.externalId !== 'inactiveDecommissioned')
        )
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

  return {
    devices: {
      devicesIsLoading,
      devicesIsError,
      devicesDaily,
      devicesError,
    },
    statuses: {
      visibleStatuses,
      deviceStatussesIsLoading,
      deviceStatussesIsError,
      deviceStatussesError,
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
