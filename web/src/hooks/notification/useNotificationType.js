import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { NOTIFICATION_TYPE_KEY, NOTIFICATION_TYPE_SELECT_ENDPOINT } from './notificationKeys.js'

const getNotificationType = async typeCategoryId =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(NOTIFICATION_TYPE_SELECT_ENDPOINT, { typeCategoryId }),
  }).then(response => response.data)

const useNotificationType = (typeCategoryId, config) =>
  useQuery([NOTIFICATION_TYPE_KEY], () => getNotificationType(typeCategoryId), config)

export default useNotificationType
