import fromPairs from 'lodash/fromPairs'
import fetchWrapperForQueries from '../MigratedComponents/QueryFetch'

// export function fetchReporters(
//   filtersParams,
//   sortCol,
//   sortDir,
//   page,
//   pageSize
// ) {
//   return dispatch => {
//     const filters = fromPairs([...filtersParams.entries()])
//     dispatch(requestReporters(sortCol, sortDir, page, pageSize, filters))

//     return aspectFetch(
//       `/person/refresh-token?${stringify({
//         sortCol,
//         sortDir,
//         page,
//         size: pageSize,
//         ...filters,
//       })}`,
//       {
//         errorNotifications: {
//           400: filterFieldsRejectedError(
//             defineMessages({
//               title: {
//                 id: 'errorResponseMessages.fetchReporters.GET.400.title',
//                 defaultMessage: 'Searching Reporters Failed',
//               },
//             })
//           ),
//           403: errorForbidden(
//             defineMessages({
//               title: {
//                 id: 'errorResponseMessages.fetchPersons.GET.403.title',
//                 defaultMessage: 'Insufficient Permissions',
//               },
//             })
//           ),
//           default: errorPleaseTryAgainInAFewMinutes(
//             defineMessages({
//               title: {
//                 id: 'errorResponseMessages.fetchReporters.GET.default.title',
//                 defaultMessage: 'Loading Reporters Failed',
//               },
//             })
//           ),
//         },
//       }
//     ).then(json => dispatch(receiveReporters(json)))
//   }
// }
/* export function updateSingleReporter(id, data) {
  return dispatch => {
    dispatch(requestUpdatingSingleReporter(id, data))
    return aspectFetch(`/person/refresh-token/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      errorNotifications: {
        404: errorNotFound(
          defineMessages({
            title: {
              id: 'errorResponseMessages.updateSingleReporter.GET.404.title',
              defaultMessage: 'Could Not Find Reporter',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id:
                'errorResponseMessages.updateSingleReporter.PUT.default.title',
              defaultMessage:
                'An Error Occurred When Trying to Save the Reporter',
            },
          })
        ),
      },
    }).then(json => dispatch(receiveUpdatedSingleReporter(json.data)))
  }
}

export function exportReporters(
  filtersParams,
  format,
  page,
  pageSize,
  fileFormat,
  reportName
) {
  return dispatch => {
    const filters = fromPairs([...filtersParams.entries()])
    return aspectFetch(
      `/reporter/export?${stringify({
        page,
        size: pageSize,
        format,
        ...filters,
      })}`,
      {
        errorNotifications: {
          400: filterFieldsRejectedError(
            defineMessages({
              title: {
                id: 'errorResponseMessages.exportResults.GET.400.title',
                defaultMessage: 'Exporting Reporters Failed',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id: 'errorResponseMessages.exportResults.GET.default.title',
                defaultMessage: 'Exporting Reporters Failed',
              },
            })
          ),
        },
      }
    ).then(async elem => {
      const file = await elem.blob
      dispatch(receivedExportResponse(file, fileFormat, reportName))
    })
  }
} */

async function getExportableFile(
  filtersParams,
  fileFormat,
  sortCol,
  sortDir,
  page,
  pageSize,
  reportName
) {
  const filters = fromPairs([...filtersParams.entries()])
  const elem = await fetchWrapperForQueries({
    endpoint: '/reporter/export',
    params: {
      sortCol,
      sortDir,
      page,
      size: pageSize,
      format: fileFormat,
      ...filters,
    },
  })

  return { elem, fileFormat, reportName }
}

const REPORTERS_LIST = {
  ENDPOINT: '/person/refresh-token',
  KEY: 'REPORTERS_LIST',
}

export { REPORTERS_LIST, getExportableFile }
