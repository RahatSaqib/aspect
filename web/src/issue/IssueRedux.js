import { defineMessages } from 'react-intl'

import { aspectFetch } from '../shared/utils/fetch'
import { errorPleaseTryAgainInAFewMinutes } from '../error/CommonErrorNotifications'

export const types = {
  RECEIVE_UPDATED_SINGLE_ISSUE: 'RECEIVE_UPDATED_SINGLE_ISSUE',
}

function receiveUpdatedSingleIssue(item) {
  return {
    type: types.RECEIVE_UPDATED_SINGLE_ISSUE,
    item,
  }
}

export function acknowledgeIssue(issueId) {
  return dispatch =>
    aspectFetch(`/issue/status/${issueId}`, {
      method: 'PUT',
      body: JSON.stringify({
        issueStatusExternalId: 'Acknowledged',
      }),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes({
          ...defineMessages({
            title: {
              id: 'errorResponseMessages.acknowledgeIssue..default.title',
              defaultMessage: 'Acknowledging Issue Failed',
            },
          }),
        }),
      },
    }).then(json => dispatch(receiveUpdatedSingleIssue(json.data)))
}
