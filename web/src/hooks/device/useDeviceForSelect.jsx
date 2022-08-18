import { useQuery } from 'react-query'
import { DEVICE_KEY, DEVICE_KEY_DEVICE_LIST_ENDPOINT } from './deviceKeys.js'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'

const getDeviceSelectList = async (countryId, partnerId, siteId, showUnapprovedDevices) => {
  return fetchWrapperForQueries({
    endpoint: replaceRouteParams(DEVICE_KEY_DEVICE_LIST_ENDPOINT, {
      countryId,
      partnerId,
      siteId,
      showUnapprovedDevices,
    }),
  }).then(response =>
    response.data.map(({ id, name }) => ({
      key: id,
      value: name,
    }))
  )
}

const useDeviceForSelect = (countryId, partnerId, siteId, showUnapprovedDevices) =>
  useQuery([DEVICE_KEY, 'list'], () => getDeviceSelectList(countryId, partnerId, siteId, showUnapprovedDevices))

export default useDeviceForSelect
