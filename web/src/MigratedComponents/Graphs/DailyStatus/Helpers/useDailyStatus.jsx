import { useEffect, useState } from 'react'
import { useQueryClient, useMutation, useQuery } from 'react-query'
import cloneDeep from 'lodash/cloneDeep'
import findIndex from 'lodash/findIndex'
import findLastIndex from 'lodash/findLastIndex'

import { getIndex, getTotalDays, dateRangeByWeekDay } from './index'
import messages from '../messages'

import { extractOptionValue } from '../../Helpers/Formatters'
import { replaceRouteParams } from '../../../QueryFetch/Helpers'

import fetchWrapperForQueries from '../../../QueryFetch'
import { DAILY_STATUS, DEVICE_STATUS, DEVICE_MAINTENANCE_STATUS_BY_PERIOD } from '../../../QueryFetch/Device'
import useI18n from '../../../../Hooks/i18n/useI18n'

const useDailyStatus = (minDate, maxDate, endpoint = DAILY_STATUS.ENDPOINT, extraParams = {}) => {
  const queryClient = useQueryClient()
  const { formatMessage } = useI18n()
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
  } = useQuery([DAILY_STATUS.KEY, { params, ...extraParams }], async ({ queryKey: [, { params }] }) =>
    fetchWrapperForQueries({
      endpoint,
      params:
        minDate && maxDate ? { ...params, ...extraParams } : Object.keys(extraParams).length > 0 ? extraParams : null,
    })
  )

  const { mutate: changeDeviceStatus } = useMutation(
    ({ deviceId, values }) =>
      fetchWrapperForQueries({
        endpoint: replaceRouteParams(DEVICE_MAINTENANCE_STATUS_BY_PERIOD.ENDPOINT, { deviceId }),
        method: 'POST',
        params: {
          externalId: values.reason,
          dateFrom: values.startedOn,
          dateTo: values.endedOn,
          notes: values.note,
        },
        customErrorNotifications: DEVICE_MAINTENANCE_STATUS_BY_PERIOD.ERRORS,
      }),
    {
      onSuccess: (responseData, requestData) => {
        const { deviceId, values } = requestData
        const selectedStatus = statuses.find(({ externalId }) => externalId === values.reason)
        queryClient.setQueryData([DAILY_STATUS.KEY, { params }], oldData => {
          const { data: devicesDailyOld } = oldData
          const devicesDailyNew = cloneDeep(devicesDailyOld)
          const { maintenanceStatusHistory } = devicesDailyNew.find(({ id }) => +id === +deviceId)
          maintenanceStatusHistory
            .filter(
              /**
               * notice that all values (`day`, 'startedOn', 'endedOn') are
               * dates formatted as 'YYYY-MM-DD'
               */
              ({ day }) => day >= values.startedOn && day <= values.endedOn
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
  } = useQuery(DEVICE_STATUS.KEY, async () => fetchWrapperForQueries({ endpoint: DEVICE_STATUS.ENDPOINT }), {
    onSuccess: ({ data }) => {
      const output = []
      data.map(status =>
        output.push({
          ...status,
          name: formatMessage(messages[status.i18nKey]),
          checked: true,
        })
      )
      setStatuses(output)
    },
  })

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
        !statuses ? statuses : statuses.filter(({ externalId }) => externalId !== 'inactiveDecommissioned')
      )
    }
  }, [statuses, visibleStatuses])

  const updateFromActionComponent = ({ identifier, selectedOption }) =>
    setParams(extractOptionValue(identifier, selectedOption))

  /**
   * getDeviceDayDetails
   *
   * Returns data needed to open AspectDialog for setting maintenance
   * status for selected date range.
   * Notice that date range is _continuous dates with SAME status
   */
  const getDeviceDayDetails = ({ day, deviceId }) => {
    const { maintenanceStatusHistory, shortName } = devicesDaily.find(({ id }) => +id === +deviceId)
    const { maintenanceStatusExternalId, maintenanceStatusNotes: note } = maintenanceStatusHistory.find(
      it => it.day === day
    )
    const fromIndex = maintenanceStatusHistory.findIndex(it => it.day === day)
    // helper to get forward or backward index of first day with another status
    const getIndex = findFn =>
      findFn(maintenanceStatusHistory, it => it.maintenanceStatusExternalId !== maintenanceStatusExternalId, fromIndex)

    const startedOnIndex = getIndex(findLastIndex) + 1
    let endedOnIndex = getIndex(findIndex)
    endedOnIndex = endedOnIndex === -1 ? maintenanceStatusHistory.length - 1 : endedOnIndex - 1
    const startedOn = maintenanceStatusHistory[startedOnIndex].day
    const endedOn = maintenanceStatusHistory[endedOnIndex].day

    return {
      deviceId,
      deviceName: shortName,
      day, // day clicked (formatted as "YYYY-MM-DD")
      periodWithSameStatus: {
        startedOn,
        endedOn,
        maintenanceStatusExternalId,
      },
      note,
    }
  }

  return {
    devices: {
      devicesIsLoading,
      devicesIsError,
      devicesDaily: devicesDaily ? devicesDaily.map(item => ({ ...item, id: +item.id })) : devicesDaily,
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
      getDeviceDayDetails,
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
