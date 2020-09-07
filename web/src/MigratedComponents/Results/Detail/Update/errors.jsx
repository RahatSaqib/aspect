import { defineMessages } from 'react-intl'
import {
  errorNotFound,
  errorPleaseTryAgainInAFewMinutes,
} from '../../../../error/CommonErrorNotifications'

const ERRORS = {
  404: errorNotFound(
    defineMessages({
      title: {
        id: 'errorResponseMessages.fetchResultsDetail.GET.404.title',
        defaultMessage: 'Could Not Find Test Result',
      },
    })
  ),
  default: errorPleaseTryAgainInAFewMinutes(
    defineMessages({
      title: {
        id: 'errorResponseMessages.fetchResultsDetailDetails.GET.default.title',
        defaultMessage: 'Error Loading Result Details',
      },
    })
  ),
}

export default ERRORS
