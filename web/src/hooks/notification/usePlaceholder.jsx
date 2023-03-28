import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { NOTIFICATION_KEY, NOTIFICATION_KEY_PLACEHOLDER_ENDPOINT } from './notificationKeys.js'

const getPlaceholder = async () =>
  fetchWrapperForQueries({ endpoint: replaceRouteParams(NOTIFICATION_KEY_PLACEHOLDER_ENDPOINT) }).then(
    response => response.data
  )

const usePlaceholder = () => useQuery([NOTIFICATION_KEY, 'PLACEHOLDER'], () => getPlaceholder())

export default usePlaceholder
