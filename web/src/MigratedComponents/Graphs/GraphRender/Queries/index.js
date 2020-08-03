import { defineMessages } from 'react-intl'
import merge from 'lodash/merge'
import isEmpty from 'lodash/isEmpty'

import { aspectFetch } from '../../../../shared/utils/fetch'
import {
  errorPleaseTryAgainInAFewMinutes,
  errorInsufficientScope,
} from '../../../../error/CommonErrorNotifications'
import { removeEmptyParams, sanitiseParams } from '../../Helpers/Redux'

const fetchGraphDataFromConfig = ({ assays, config, updatedParams }) => {
  const { whiteListed } = assays
  const {
    containerId,
    api: { endpoint, params, method = 'GET' },
  } = config
  const mergedParams =
    isEmpty(params) && isEmpty(updatedParams)
      ? updatedParams
      : { ...merge(params, updatedParams) }

  const urlParams = removeEmptyParams(mergedParams)
  const assayParams =
    whiteListed && whiteListed.length > 0
      ? whiteListed.map(a => `assay=${encodeURIComponent(a)}`).join('&')
      : ''

  let endpointParams = ''

  for (const [key, value] of Object.entries(sanitiseParams(urlParams))) {
    if (Array.isArray(value)) {
      endpointParams += value
        .map(v => `${key}=${encodeURIComponent(v)}`)
        .join('&')
    } else {
      endpointParams += `&${key}=${encodeURIComponent(value)}`
    }
  }

  const endpointToCall =
    method === 'GET'
      ? `/${endpoint}?${assayParams}&${endpointParams}`
      : `/${endpoint}`
  const body =
    method === 'GET'
      ? {}
      : {
          body: JSON.stringify(mergedParams),
        }

  return aspectFetch(endpointToCall, {
    method,
    ...body,
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
            defaultMessage: `Error Loading Dashboard ${containerId}`,
          },
        })
      ),
    },
  })
    .then(({ data }) => data)
    .catch(err => err)
}

export default fetchGraphDataFromConfig
