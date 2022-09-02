import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { DEVICE_KEY, DEVICE_KEY_DEVICE_LIST_ENDPOINT } from './deviceKeys.js'

const getDeviceSelectList = async (countryId, partnerId, siteId, showUnapprovedDevices, onlyResultDevices) => {
  return fetchWrapperForQueries({
    endpoint: replaceRouteParams(DEVICE_KEY_DEVICE_LIST_ENDPOINT, {
      countryId,
      partnerId,
      siteId,
      showUnapprovedDevices,
      onlyResultDevices,
    }),
  }).then(response =>
    response.data.map(({ id, name, siteId, deviceTypeId }) => ({
      key: id,
      value: name,
      siteId,
      deviceTypeId,
    }))
  )
}

const useDeviceForSelect = params => {
  const {
    countryId = '',
    partnerId = '',
    siteId = '',
    showUnapprovedDevices = false,
    onlyResultDevices = false,
  } = params
  return useQuery([DEVICE_KEY, 'list'], () =>
    getDeviceSelectList(countryId, partnerId, siteId, showUnapprovedDevices, onlyResultDevices)
  )
}

export default useDeviceForSelect
