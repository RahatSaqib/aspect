import { useEffect, useState, useCallback } from 'react'
import endOfMonth from 'date-fns/endOfMonth'
import format from 'date-fns/format'
import startOfMonth from 'date-fns/startOfMonth'
import cloneDeep from 'lodash/cloneDeep'
import findIndex from 'lodash/findIndex'
import findLastIndex from 'lodash/findLastIndex'
import { useIntl } from 'react-intl'
import { useQueryClient, useMutation, useQuery } from 'react-query'
import CONSTS from '../../../../utils/consts/DateTime/CONSTS'
import fetchWrapperForQueries from '../../../QueryFetch'
import { DAILY_STATUS, DEVICE_STATUS, DEVICE_MAINTENANCE_STATUS_BY_PERIOD } from '../../../QueryFetch/Device'
import { replaceRouteParams } from '../../../QueryFetch/Helpers'
import messages from '../messages'
import { getIndex, getTotalDays, dateRangeByWeekDay } from './index'

const getParamsFormatted = params => {
  const { minDate, maxDate } = params
  return {
    ...params,
    minDate: format(minDate, "yyyy-MM-dd'T'00:00:00.000'Z'"),
    maxDate: format(maxDate, "yyyy-MM-dd'T'23:59:59.999'Z'"),
  }
}

/**
 * Notice that `minDate` and `maxDate` are local Date objects
 * (not modified into UTC or ISO)
 */
const useDailyStatus = (minDate, maxDate, endpoint = DAILY_STATUS.ENDPOINT, extraParams = {}) => {
  const queryClient = useQueryClient()
  const { formatMessage } = useIntl()
  const [statuses, setStatuses] = useState(false)
  const [visibleStatuses, setVisibleStatuses] = useState(false)
  const [toggleAll, setToggleAll] = useState({
    checked: true,
    label: formatMessage(messages.dailyStatusToggleAll),
    key: 'all',
  })
  const [params, setParams] = useState({ minDate, maxDate })
  const dateRanges = dateRangeByWeekDay(params.minDate, params.maxDate)
  const totalDays = getTotalDays(params)

  const {
    isLoading: devicesIsLoading,
    isError: devicesIsError,
    data: { data: devicesDaily } = false,
    error: devicesError,
  } = useQuery(
    [DAILY_STATUS.KEY, { params, ...extraParams }],
    async ({ queryKey: [, { params }] }) =>
      fetchWrapperForQueries({
        endpoint,
        params:
          params.minDate && params.maxDate
            ? { ...getParamsFormatted(params), ...extraParams }
            : Object.keys(extraParams).length > 0
            ? extraParams
            : null,
      }),
    {
      onSuccess: responseData => {
        responseData.data = responseData.data.map(item => ({ ...item, id: +item.id }))
      },
    }
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
          expectedBackOnline: values.expectedBackOnline,
          notes: values.note,
          /**
           * use params from filters for entire component - needed on API side to
           * return data for whole period (not only for selected date range) in order
           * to show correct value for daysInSameStatus
           */
          parentQuery: getParamsFormatted(params),
        },
        customErrorNotifications: DEVICE_MAINTENANCE_STATUS_BY_PERIOD.ERRORS,
      }),
    {
      onSuccess: (responseData, requestData) => {
        const { deviceId } = requestData
        queryClient.setQueryData([DAILY_STATUS.KEY, { params }], oldData => {
          const { data: devicesDailyOld } = oldData
          const devicesDailyNew = cloneDeep(devicesDailyOld)
          const { deviceData } = responseData.data
          const indexOfDeviceRow = devicesDailyNew.findIndex(({ id }) => +id === +deviceId)

          devicesDailyNew[indexOfDeviceRow] = deviceData

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

  const updateFromActionComponent = ({ selectedOption }) => {
    const isLast30Days = selectedOption?.id === CONSTS.DATE_RANGE_OPTIONS.LAST_30_DAYS
    const minDate = new Date(selectedOption.value.minDate)
    const maxDate = new Date(selectedOption.value.maxDate)
    setParams({
      minDate: isLast30Days ? minDate : startOfMonth(minDate),
      maxDate: isLast30Days ? maxDate : endOfMonth(maxDate),
    })
  }

  /**
   * getDeviceDayDetails
   *
   * Returns data needed to open AspectDialog for setting maintenance
   * status for selected date range.
   * Notice that date range is _continuous dates with SAME status
   *
   * FYI - using hook useCallback to cache function reference, because
   * this func is used in event handler `onClickDay` which is passed in a component
   * which renders all days of a device. And func `onClickDay` is also wrapped wit
   * useCallback.
   */
  const getDeviceDayDetails = useCallback(
    ({ day, deviceId }) => {
      const { maintenanceStatusHistory, name, siteContacts, hoursStart, hoursEnd } = devicesDaily.find(
        ({ id }) => +id === +deviceId
      )
      const {
        maintenanceStatusExternalId,
        maintenanceStatusNotes: note,
        expectedBackOnline,
      } = maintenanceStatusHistory.find(it => it.day === day)
      const fromIndex = maintenanceStatusHistory.findIndex(it => it.day === day)
      // helper to get forward or backward index of first day with another status
      const getIndex = findFn =>
        findFn(
          maintenanceStatusHistory,
          it => it.maintenanceStatusExternalId !== maintenanceStatusExternalId,
          fromIndex
        )

      const startedOnIndex = getIndex(findLastIndex) + 1
      let endedOnIndex = getIndex(findIndex)
      endedOnIndex = endedOnIndex === -1 ? maintenanceStatusHistory.length - 1 : endedOnIndex - 1
      const startedOn = maintenanceStatusHistory[startedOnIndex].day
      const endedOn = maintenanceStatusHistory[endedOnIndex].day

      return {
        deviceId,
        deviceName: name,
        siteProps: {
          siteContacts,
          hoursStart,
          hoursEnd,
        },
        day, // day clicked (formatted as "YYYY-MM-DD")
        periodWithSameStatus: {
          startedOn,
          endedOn,
          maintenanceStatusExternalId,
        },
        note,
        expectedBackOnline,
      }
    },
    [devicesDaily]
  )
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
