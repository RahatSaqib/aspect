import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import {
  NOTIFICATION_TYPE_KEY,
  NOTIFICATION_TYPE_SELECT_ALL_ENDPOINT,
  NOTIFICATION_TYPE_SELECT_ENDPOINT,
} from './notificationKeys.js'

const getNotificationType = async categoryTypeId =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(
      categoryTypeId ? NOTIFICATION_TYPE_SELECT_ENDPOINT : NOTIFICATION_TYPE_SELECT_ALL_ENDPOINT,
      categoryTypeId ? { categoryTypeId } : null
    ),
  }).then(response => response.data)

const useNotificationType = (categoryTypeId, config) =>
  useQuery([NOTIFICATION_TYPE_KEY, categoryTypeId], () => getNotificationType(categoryTypeId), config)

export default useNotificationType
