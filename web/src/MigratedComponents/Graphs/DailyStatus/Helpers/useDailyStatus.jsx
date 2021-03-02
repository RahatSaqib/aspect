import { useEffect, useState } from 'react'
import { queryCache, useMutation, useQuery } from 'react-query'
import { useIntl } from 'react-intl'
import cloneDeep from 'lodash/cloneDeep'

import { getIndex, getTotalDays, dateRangeByWeekDay } from './index'
import messages from '../messages'

import { extractOptionValue } from '../../Helpers/Formatters'

import fetchWrapperForQueries from '../../../QueryFetch'
import { DAILY_STATUS, DEVICE_STATUS } from '../../../QueryFetch/Device'
import { getDateString } from '../../../../shared/utils/dateFormat'

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

  const [changeDeviceStatus] = useMutation(
    ({ deviceId, values }) =>
      fetchWrapperForQueries({
        endpoint: `/device/maintenance-status-by-period/${deviceId}`,
        method: 'POST',
        params: {
          externalId: values.reason,
          dateFrom: getDateString(values.startedOn),
          dateTo: getDateString(values.endedOn),
          notes: values.note,
        },
      }),
    {
      onSuccess: (responseData, requestData) => {
        const { deviceId, values } = requestData
        const selectedStatus = statuses.find(
          it => it.externalId === values.reason
        )
        queryCache.setQueryData([DAILY_STATUS.KEY, { params }], oldData => {
          const { data: devicesDailyOld } = oldData
          const devicesDailyNew = cloneDeep(devicesDailyOld)
          const { maintenanceStatusHistory } = devicesDailyNew.find(
            ({ id }) => id === deviceId
          )
          maintenanceStatusHistory
            .filter(
              it => it.day >= values.startedOn && it.day <= values.endedOn
            )
            .forEach(it => {
              it.maintenanceStatusExternalId = selectedStatus.externalId
              it.maintenanceStatusI18nKey = selectedStatus.i18nKey
              it.maintenanceStatusName = selectedStatus.name
            })
          return {
            ...oldData,
            data: devicesDailyNew,
          }
        })
      },
    }
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
      changeDeviceStatus,
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
