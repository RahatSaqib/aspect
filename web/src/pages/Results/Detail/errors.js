import { defineMessages } from 'react-intl'
import { errorNotFound, errorPleaseTryAgainInAFewMinutes } from '../../../utils/error/CommonErrorNotifications'

const ResultDetailsErrors = {
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

export { ResultDetailsErrors }
