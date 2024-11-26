import isArray from 'lodash/isArray'
import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { PERSON_HAS_PERMISSION_ENDPOINT, PERSON_HAS_PERMISSION_KEY } from './personKeys.js'

const hasCountryPermission = async permissions =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(PERSON_HAS_PERMISSION_ENDPOINT),
    params: isArray(permissions) ? permissions.map(p => ({ permissions: p })) : [{ permissions }],
  })

const useHasCountryPermission = permissions =>
  useQuery([PERSON_HAS_PERMISSION_KEY, permissions], () => hasCountryPermission(permissions), {})

export default useHasCountryPermission
