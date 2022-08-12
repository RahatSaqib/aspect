import { defineMessages } from 'react-intl'
import {
  errorPleaseTryAgainInAFewMinutes,
  errorForbidden,
  errorUnauthorized,
  errorConflict,
  errorEntity,
} from '../../utils/error/CommonErrorNotifications'

const defaultErrors = () => ({
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
  409: errorConflict(
    defineMessages({
      title: {
        id: 'queryFetch.errorResponseMessages.GET.409.title',
        defaultMessage: ' data',
      },
    })
  ),
  422: errorEntity(
    defineMessages({
      title: {
        id: 'queryFetch.errorResponseMessages.GET.422.title',
        defaultMessage: 'Invalid data',
      },
    })
  ),
  default: errorPleaseTryAgainInAFewMinutes(
    defineMessages({
      title: {
        id: 'queryFetch.errorResponseMessages.GET.default.title',
        defaultMessage: 'Error Fetching Endpoint',
      },
    })
  ),
})

export default defaultErrors
