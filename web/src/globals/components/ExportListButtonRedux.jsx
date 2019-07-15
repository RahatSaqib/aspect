import Immutable from 'immutable'
import format from 'date-fns/format'

export const exportTypes = {
  EXPORT_RESPONSE_FILE_RECEIVED: 'EXPORT_RESPONSE_FILE_RECEIVED',
}
export function receivedExportResponse(response, format, reportName) {
  return {
    type: exportTypes.EXPORT_RESPONSE_FILE_RECEIVED,
    response,
    format,
    reportName,
  }
}
const ReportData = Immutable.Record({
  reportName: undefined,
  fileFormat: undefined,
})

const initialState = new ReportData()
export default function exportListButtonReducer(state = initialState, action) {
  switch (action.type) {
    case exportTypes.EXPORT_RESPONSE_FILE_RECEIVED: {
      const fileURL = URL.createObjectURL(action.response)
      const fileLink = document.createElement('a')
      fileLink.href = fileURL
      const fileName = `report_${action.reportName}${format(
        new Date(),
        'yyyy_MM_dd_HH_mm_ss'
      )}.${action.format}`
      fileLink.download = fileName
      fileLink.click()

      // Open the URL on new Window
      return state.withMutations(mutState => {
        mutState.set('reportName', action.reportName)
        mutState.set('fileFormat', action.format)
      })
    }
    default:
      return state
  }
}
