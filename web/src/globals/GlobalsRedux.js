import Immutable from 'immutable'
import format from 'date-fns/format'

export const types = {
  GLOBALS_SET_NAV_TITLE: 'GLOBALS_SET_NAV_TITLE',
  GLOBALS_SET_LAST_SERVER_RESPONSE_TIME:
    'GLOBALS_SET_LAST_SERVER_RESPONSE_TIME',
  EXPORT_RESPONSE_FILE_RECEIVED: 'EXPORT_RESPONSE_FILE_RECEIVED',
  EXPORT_FILE_STARTED: 'EXPORT_FILE_STARTED',
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
export function onStartDownloading() {
  return {
    type: types.EXPORT_FILE_STARTED,
  }
}

export function receivedFileResponse(blob, fileName) {
  safeDownloadFile(blob, fileName)
  return {
    type: types.EXPORT_RESPONSE_FILE_RECEIVED,
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
  downloadStarted: false,
})

const initialState = new Globals()

export default function globalsReducer(state = initialState, action) {
  switch (action.type) {
    case types.EXPORT_RESPONSE_FILE_RECEIVED: {
      return state.set('downloadStarted', false)
    }
    case types.EXPORT_FILE_STARTED: {
      return state.set('downloadStarted', true)
    }
    case types.GLOBALS_SET_NAV_TITLE:
      return state.set('title', action.title)
    case types.GLOBALS_SET_LAST_SERVER_RESPONSE_TIME:
      return state.set('lastServerResponseTime', action.serverTime)
    default:
      return state
  }
}

function safeDownloadFile(blob, fileName) {
  const fileURL = URL.createObjectURL(blob)
  const fileLink = document.createElement('a')
  fileLink.href = fileURL
  fileLink.download = fileName
  document.body.appendChild(fileLink)

  fileLink.click()
  setTimeout(() => {
    document.body.removeChild(fileLink)
    window.URL.revokeObjectURL(fileURL)
  }, 100)
}

function downloadFile(blob, reportName, reportFormat) {
  const fileName = `report_${reportName}${format(
    new Date(),
    'yyyy_MM_dd_HH_mm_ss'
  )}.${reportFormat}`
  safeDownloadFile(blob, fileName)
}
