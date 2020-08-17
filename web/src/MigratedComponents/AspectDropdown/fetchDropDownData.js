import { defineMessages } from 'react-intl'
import merge from 'lodash/merge'
import {
  errorPleaseTryAgainInAFewMinutes,
  errorInsufficientScope,
} from '../../error/CommonErrorNotifications'

import { aspectFetch } from '../../shared/utils/fetch'

const fetchDropDownData = endpoint => {
  return aspectFetch(endpoint, {
    method: 'GET',
    errorNotifications: {
      403: errorInsufficientScope(
        defineMessages({
          title: {
            id: 'errorResponseMessages.fetchDropDownData.GET.403.title',
            defaultMessage: 'Insufficient Permissions',
          },
        })
      ),
      default: errorPleaseTryAgainInAFewMinutes(
        defineMessages({
          title: {
            id: 'errorResponseMessages.fetchDropDownData.GET.default.title',
            defaultMessage: `Error Loading DropDown ${'containerId'}`,
          },
        })
      ),
    },
  })
    .then(({ data }) => data)
    .catch(err => err)
}

export default fetchDropDownData
