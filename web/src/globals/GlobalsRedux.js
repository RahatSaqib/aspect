import Immutable from 'immutable'
import format from 'date-fns/format'

export const types = {
  GLOBALS_SET_NAV_TITLE: 'GLOBALS_SET_NAV_TITLE',
  GLOBALS_SET_LAST_SERVER_RESPONSE_TIME:
    'GLOBALS_SET_LAST_SERVER_RESPONSE_TIME',
  EXPORT_RESPONSE_FILE_RECEIVED: 'EXPORT_RESPONSE_FILE_RECEIVED',
}

/*
 * ---------------- Action Creators -----------------
 */

export function setLastServerResponseTime(serverTime) {
  return {
    type: types.GLOBALS_SET_LAST_SERVER_RESPONSE_TIME,
    serverTime,
  }
}

export function setNavTitle(title) {
  return {
    type: types.GLOBALS_SET_NAV_TITLE,
    title,
  }
}
export function receivedExportResponse(blob, format, reportName) {
  downloadFile(blob, reportName, format)
  return {
    type: types.EXPORT_RESPONSE_FILE_RECEIVED,
    blob,
    format,
    reportName,
  }
}
/*
 * ---------------- Reducers -----------------
 */
const Globals = Immutable.Record({
  title: undefined,
  lastServerResponseTime: new Date(),
  reportName: undefined,
  fileFormat: undefined,
})

const initialState = new Globals()

export default function globalsReducer(state = initialState, action) {
  switch (action.type) {
    case types.EXPORT_RESPONSE_FILE_RECEIVED: {
      // Open the URL on new Window
      return state
    }
    case types.GLOBALS_SET_NAV_TITLE:
      return state.set('title', action.title)
    case types.GLOBALS_SET_LAST_SERVER_RESPONSE_TIME:
      return state.set('lastServerResponseTime', action.serverTime)
    default:
      return state
  }
}

function downloadFile(blob, reportName, reportFormat) {
  const fileURL = URL.createObjectURL(blob)
  const fileLink = document.createElement('a')
  fileLink.href = fileURL
  const fileName = `report_${reportName}${format(
    new Date(),
    'yyyy_MM_dd_HH_mm_ss'
  )}.${reportFormat}`
  fileLink.download = fileName
  document.body.appendChild(fileLink)

  fileLink.click()
  setTimeout(() => {
    document.body.removeChild(fileLink)
    window.URL.revokeObjectURL(fileURL)
  }, 100)
}
