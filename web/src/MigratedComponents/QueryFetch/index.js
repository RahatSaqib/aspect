import { defineMessages } from 'react-intl'
import merge from 'lodash/merge'
import { aspectFetch } from '../../shared/utils/fetch'
import {
  errorPleaseTryAgainInAFewMinutes,
  errorInsufficientScope,
} from '../../error/CommonErrorNotifications'

const mergeErrorNotifications = (endpoint, customErrorNotifications) =>
  merge(
    {
      403: errorInsufficientScope(
        defineMessages({
          title: {
            id: 'errorResponseMessages.fetchGraphDataFromConfig.GET.403.title',
            defaultMessage: 'Insufficient Permissions',
          },
        })
      ),
      default: errorPleaseTryAgainInAFewMinutes(
        defineMessages({
          title: {
            id:
              'errorResponseMessages.fetchGraphDataFromConfig.GET.default.title',
            defaultMessage: `Error Fetching Endpoint: ${endpoint}`,
          },
        })
      ),
    },
    customErrorNotifications
  )

const fetchWrapperForQueries = ({
  endpoint,
  method = 'GET',
  params = {},
  customErrorNotifications = {},
}) => {
  if (!endpoint) throw new Error(`You need to specify the 'endpoint' property`)

  let body = null
  const errorNotifications = mergeErrorNotifications(
    endpoint,
    customErrorNotifications
  )

  switch (method) {
    case 'POST':
    case 'PUT':
      body = JSON.stringify(params)
      break
    case 'GET':
      endpoint += `?${Object.keys(params)
        .map(k => `${k}=${encodeURIComponent(params[k])}`)
        .join('&')}`
      break
    default:
      throw new Error(
        `Method ${method} is not supported by fetchWrapperForQueries function`
      )
  }

  return aspectFetch(endpoint, {
    method,
    errorNotifications,
    body,
  })
    .then(({ data }) => data)
    .catch(err => err)
}

export default fetchWrapperForQueries
