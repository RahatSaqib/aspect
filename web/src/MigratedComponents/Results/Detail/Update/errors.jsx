import { defineMessages } from 'react-intl'
import {
  errorNotFound,
  errorPleaseTryAgainInAFewMinutes,
} from '../../../../error/CommonErrorNotifications'

const ERRORS = {
  ResultDetails: {
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
          id:
            'errorResponseMessages.fetchResultsDetailDetails.GET.default.title',
          defaultMessage: 'Error Loading Result Details',
        },
      })
    ),
  },
  SitesAll: {
    404: errorNotFound(
      defineMessages({
        title: {
          id: 'errorResponseMessages.fetchAllSites.GET.404.title',
          defaultMessage: 'Could Not Load All Sites',
        },
      })
    ),
    default: errorPleaseTryAgainInAFewMinutes(
      defineMessages({
        title: {
          id: 'errorResponseMessages.fetchAllSites.GET.default.title',
          defaultMessage: 'Error Loading All Sites',
        },
      })
    ),
  },
  TransferResult: {
    404: errorNotFound(
      defineMessages({
        title: {
          id: 'errorResponseMessages.transferResult.GET.404.title',
          defaultMessage: 'Could Not Transfer Result',
        },
      })
    ),
    default: errorPleaseTryAgainInAFewMinutes(
      defineMessages({
        title: {
          id: 'errorResponseMessages.transferResult.GET.default.title',
          defaultMessage: 'Error Transferring Result',
        },
      })
    ),
  },
}

export default ERRORS
