import Immutable from 'immutable'

export const types = {
  EXPORT_CONFIRMATION_ASK: 'EXPORT_CONFIRMATION_ASK',
  EXPORT_NOT_CONFIRMED: 'EXPORT_NOT_CONFIRMED',
  EXPORT_BEGIN_PROCESSING: 'EXPORT_BEGIN_PROCESSING',
  EXPORT_RESPONSE_RECEIVED: 'EXPORT_RESPONSE_RECEIVED',
}

export const exportFormatTypes = {
  EXCEL: 'excel',
  CSV: 'csv',
}

// -------------------------------
export function askExportConfirmation(currentFormatType) {
  return {
    type: types.EXPORT_CONFIRMATION_ASK,
    currentFormatType,
  }
}
export function closeExportConfirmation() {
  return {
    type: types.EXPORT_NOT_CONFIRMED,
  }
}
export function beginListExportProcessing(currentFormatType) {
  const args = {
    currentFormatType,
  }
  if (currentFormatType === exportFormatTypes.EXCEL) {
    args.processingExportExcel = true
  } else {
    args.processingExportCsv = true
  }

  return {
    type: types.EXPORT_BEGIN_PROCESSING,
    args,
  }
}

export function receivedExportResponse(currentFormatType, response) {
  const args = {}
  if (currentFormatType === exportFormatTypes.EXCEL) {
    args.processingExportExcel = false
  } else {
    args.processingExportCsv = false
  }

  return {
    type: types.EXPORT_RESPONSE_RECEIVED,
    args,
    response,
  }
}

/*
 * ---------------- Reducers -----------------
 */
const ListConfig = Immutable.Record({
  assayAndResultCategory: false,
  geography: false,
  state: true, // under geography, optional
  lga: true, // under geography, optional
  date: false,
  partnerId: false,
  patientOrResearchId: false,
  sampleId: false,
  sampleGroup: false,
  deviceName: false,
  siteName: false,
  sampleOriginSite: false,
  contactNameOrEmail: false,
  consumable: false,
  workflowStatus: false,
  deviceStatus: false,
  externalId: false,
})

const ListExport = Immutable.Record({
  askingConfirmation: false,
  processingExportExcel: false,
  processingExportCsv: false,
  currentFormatType: undefined,
})

const Filter = Immutable.Record({
  listConfig: new ListConfig(),
  listExport: new ListExport(),
})

const initialState = new Filter()

export default function filterReducer(state = initialState, action) {
  switch (action.type) {
    // -----------
    // List Export actions
    // -----------
    case types.EXPORT_CONFIRMATION_ASK:
      return state.mergeIn(['listExport'], {
        askingConfirmation: true,
        currentFormatType: action.currentFormatType,
      })

    case types.EXPORT_NOT_CONFIRMED:
      return state.mergeIn(['listExport'], {
        askingConfirmation: false,
        currentFormatType: undefined,
      })

    case types.EXPORT_BEGIN_PROCESSING:
      return state.mergeIn(['listExport'], action.args)

    case types.EXPORT_RESPONSE_RECEIVED:
      if (action.response.ok === true) {
        const a = document.getElementById('anchorExportProxy')
        a.href = action.response.url
        a.click()
      }
      return state.mergeIn(['listExport'], action.args)

    default:
      return state
  }
}
