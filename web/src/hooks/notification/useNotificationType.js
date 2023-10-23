import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { NOTIFICATION_TYPE_KEY, NOTIFICATION_TYPE_SELECT_ENDPOINT } from './notificationKeys.js'

const getNotificationType = async categoryTypeId =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(NOTIFICATION_TYPE_SELECT_ENDPOINT, { categoryTypeId }),
  }).then(response => response.data)

const useNotificationType = (categoryTypeId, config) =>
  useQuery([NOTIFICATION_TYPE_KEY], () => getNotificationType(categoryTypeId), config)

export default useNotificationType
