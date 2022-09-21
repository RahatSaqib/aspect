import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { NOTIFICATION_KEY, NOTIFICATION_KEY_ENDPOINT } from './notificationKeys'

const saveNotification = async ({ values, id }) =>
  fetchWrapperForQueries({
    endpoint: `${NOTIFICATION_KEY_ENDPOINT}${id ? `/${id}` : ''}`,
    method: id ? 'PUT' : 'POST',
    params: { ...values },
  })

const useSaveNotification = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation(({ values, id }) => saveNotification({ values, id }), {
    onSuccess: () => queryClient.invalidateQueries([NOTIFICATION_KEY, 'list']),
  })

  return mutation
}

export default useSaveNotification
