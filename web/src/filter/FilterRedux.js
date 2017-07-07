import invariant from 'invariant'
import Immutable from 'immutable'

export const types = {
  CONFIGURE_LIST_FILTER: 'CONFIGURE_LIST_FILTER',

  CLEAR_LIST_FILTER: 'CLEAR_LIST_FILTER',
  CHANGE_LIST_FILTER: 'CHANGE_LIST_FILTER',
  REMOVE_LIST_FILTER_ITEM: 'REMOVE_LIST_FILTER_ITEM',

  EXPORT_CONFIRMATION_ASK: 'EXPORT_CONFIRMATION_ASK',
  EXPORT_NOT_CONFIRMED: 'EXPORT_NOT_CONFIRMED',
  EXPORT_BEGIN_PROCESSING: 'EXPORT_BEGIN_PROCESSING',
  EXPORT_RESPONSE_RECEIVED: 'EXPORT_RESPONSE_RECEIVED',
}

export const exportFormatTypes = {
  EXCEL: 'excel',
  CSV: 'csv',
}

/*
 * ---------------- Action Creators -----------------
 */
export function configureListFilter(listConfig) {
  return {
    type: types.CONFIGURE_LIST_FILTER,
    listConfig,
  }
}

export function clearListFilter() {
  return {
    type: types.CLEAR_LIST_FILTER,
  }
}

export function changeListFilter(listFilter) {
  return {
    type: types.CHANGE_LIST_FILTER,
    listFilter,
  }
}

export function removeListFilterItem(filterKey) {
  return {
    type: types.REMOVE_LIST_FILTER_ITEM,
    filterKey,
  }
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

export const ListFilter = Immutable.Record({
  assayId: undefined,
  countryId: undefined,
  stateId: undefined,
  lgaId: undefined,
  minDate: undefined,
  maxDate: undefined,
  partnerId: undefined,
  patientOrResearchId: undefined,
  sampleId: undefined,
  sampleGroup: undefined,
  deviceName: undefined,
  resultCategoryId: undefined,
  siteName: undefined,
  sampleOriginSite: undefined,
  contactNameOrEmail: undefined,
  consumableId: undefined,
  workflowStatusId: undefined,
  deviceStatusId: undefined,
  externalId: undefined,
})

const ListExport = Immutable.Record({
  askingConfirmation: false,
  processingExportExcel: false,
  processingExportCsv: false,
  currentFormatType: undefined,
})

const Filter = Immutable.Record({
  listConfig: new ListConfig(),
  listFilter: new ListFilter(),
  listExport: new ListExport(),
})

const initialState = new Filter()

export default function filterReducer(state = initialState, action) {
  switch (action.type) {
    case types.CONFIGURE_LIST_FILTER:
      return state.withMutations(mutState => {
        const nextListConfig = new ListConfig(action.listConfig)
        mutState.set('listConfig', nextListConfig)

        const deleteFromMap = (a, k) => a.delete(k)

        const nextListFilter = nextListConfig.reduce((acc, value, key) => {
          // eslint-disable-line array-callback-return
          if (value) {
            return acc
          }
          switch (key) {
            case 'assayAndResultCategory':
              return ['assayId', 'resultCategoryId'].reduce(deleteFromMap, acc)
            case 'geography':
              return ['countryId', 'stateId', 'lgaId'].reduce(
                deleteFromMap,
                acc
              )
            case 'state':
            case 'lga':
              return acc
            case 'date':
              return ['minDate', 'maxDate'].reduce(deleteFromMap, acc)
            case 'patientOrResearchId':
            case 'partnerId':
            case 'sampleId':
            case 'sampleGroup':
            case 'deviceName':
            case 'siteName':
            case 'sampleOriginSite':
            case 'contactNameOrEmail':
            case 'externalId':
              return acc.delete(key)
            case 'consumable':
              return acc.delete('consumableId')
            case 'workflowStatus':
              return acc.delete('workflowStatusId')
            case 'deviceStatus':
              return acc.delete('deviceStatusId')
            default:
              invariant(false, 'Unreachable')
          }
          return acc
        }, state.listFilter)

        mutState.set('listFilter', nextListFilter)
      })
    case types.CLEAR_LIST_FILTER:
      return state.set('listFilter', initialState.listFilter)
    case types.CHANGE_LIST_FILTER:
      return state.mergeIn(['listFilter'], action.listFilter)
    case types.REMOVE_LIST_FILTER_ITEM:
      return state.withMutations(mutState => {
        switch (action.filterKey) {
          default:
            break
          case 'countryId':
            mutState
              .deleteIn(['listFilter', 'stateId'])
              .deleteIn(['listFilter', 'lgaId'])
            break
          case 'stateId':
            mutState.deleteIn(['listFilter', 'lgaId'])
            break
          case 'assayId':
            mutState.deleteIn(['listFilter', 'resultCategoryId'])
            break
        }
        mutState.deleteIn(['listFilter', action.filterKey])
      })
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
