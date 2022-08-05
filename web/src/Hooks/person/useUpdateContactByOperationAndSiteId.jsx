import { useMutation, useQueryClient } from 'react-query'
import { PERSON_KEY, PERSON_KEY_OPERATION_SITE_ID_ENDPOINT } from './personKeys'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import { replaceRouteParams } from '../../MigratedComponents/QueryFetch/Helpers'

const updateContactByOperationAndSiteId = async ({ id, operation }, siteId) =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(PERSON_KEY_OPERATION_SITE_ID_ENDPOINT, { operation, siteId }),
    method: 'PUT',
    params: { id },
  })

const useUpdateContactByOperationAndSiteId = siteId => {
  const queryClient = useQueryClient()
  const mutation = useMutation(data => updateContactByOperationAndSiteId(data, siteId), {
    onSuccess: () => queryClient.invalidateQueries([PERSON_KEY, siteId]),
  })
  return mutation
}

export default useUpdateContactByOperationAndSiteId
