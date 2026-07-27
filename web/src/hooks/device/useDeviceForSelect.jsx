import isUndefined from 'lodash/isUndefined'
import omitBy from 'lodash/omitBy'
import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { DEVICE_KEY_DEVICE_LIST_ENDPOINT } from './deviceKeys.js'

const getDeviceSelectList = async params => {
  // Remove all attributes that are undefined
  return fetchWrapperForQueries({
    endpoint: DEVICE_KEY_DEVICE_LIST_ENDPOINT,
    params: omitBy(params, isUndefined),
  }).then(response => response.data)
}

const useDeviceForSelect = params => {
  const {
    countryId = '',
    partnerId = '',
    siteId = '',
    deviceTypeExternalId,
    showUndeployedDevices = false,
    onlyResultDevices = false,
  } = params
  return useQuery(
    [
      DEVICE_KEY_DEVICE_LIST_ENDPOINT,
      countryId,
      partnerId,
      siteId,
      deviceTypeExternalId,
      showUndeployedDevices,
      onlyResultDevices,
    ],
    () =>
      getDeviceSelectList({
        countryId,
        partnerId,
        siteId,
        deviceTypeExternalId,
        showUndeployedDevices,
        onlyResultDevices,
      })
  )
}

export { useDeviceForSelect }
