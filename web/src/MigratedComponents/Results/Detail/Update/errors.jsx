import { defineMessages } from 'react-intl'
import { errorNotFound, errorPleaseTryAgainInAFewMinutes } from '../../../../error/CommonErrorNotifications'

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

const SitesAllErrors = {
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
}

const TransferResultErrors = {
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
}

export { ResultDetailsErrors, SitesAllErrors, TransferResultErrors }
