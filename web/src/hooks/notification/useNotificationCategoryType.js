import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { NOTIFICATION_CATEGORY_TYPE_KEY, NOTIFICATION_CATEGORY_TYPE_SELECT_ENDPOINT } from './notificationKeys.js'

const getNotificationTypeCategory = () =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(NOTIFICATION_CATEGORY_TYPE_SELECT_ENDPOINT),
  }).then(response => response.data)

const useNotificationCategoryType = config =>
  useQuery([NOTIFICATION_CATEGORY_TYPE_KEY], () => getNotificationTypeCategory(), config)

export default useNotificationCategoryType
