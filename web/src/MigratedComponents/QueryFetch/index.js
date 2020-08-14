import { defineMessages } from 'react-intl'

import { aspectFetch } from '../../shared/utils/fetch'
import {
  errorPleaseTryAgainInAFewMinutes,
  errorInsufficientScope,
} from '../../error/CommonErrorNotifications'

const fetchWrapperForQueries = endpoint => {
  return aspectFetch(endpoint, {
    method: 'GET',
    errorNotifications: {
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
  })
    .then(({ data }) => data)
    .catch(err => err)
}

export default fetchWrapperForQueries
