import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { NOTIFICATION_KEY, NOTIFICATION_KEY_BY_ID_ENDPOINT } from './notificationKeys.js'

const getNotificationById = async notificationId =>
  fetchWrapperForQueries({ endpoint: replaceRouteParams(NOTIFICATION_KEY_BY_ID_ENDPOINT, { notificationId }) }).then(
    response => response.data
  )

const useNotification = (notificationId, config) =>
  useQuery([NOTIFICATION_KEY, notificationId], () => getNotificationById(notificationId), config)

export default useNotification
