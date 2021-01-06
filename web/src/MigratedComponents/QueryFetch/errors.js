import { defineMessages } from 'react-intl'
import {
  errorPleaseTryAgainInAFewMinutes,
  errorForbidden,
  errorUnauthorized,
} from '../../error/CommonErrorNotifications'

const defaultErrors = endpoint => ({
  401: errorUnauthorized(
    defineMessages({
      title: {
        id: 'queryFetch.errorResponseMessages.GET.401.title',
        defaultMessage: 'Invalid Credentials',
      },
    })
  ),
  403: errorForbidden(
    defineMessages({
      title: {
        id: 'queryFetch.errorResponseMessages.GET.403.title',
        defaultMessage: 'Access denied',
      },
    })
  ),
  default: errorPleaseTryAgainInAFewMinutes(
    defineMessages({
      title: {
        id: 'queryFetch.errorResponseMessages.GET.default.title',
        defaultMessage: `Error Fetching Endpoint: ${endpoint}`,
      },
    })
  ),
})

export default defaultErrors
