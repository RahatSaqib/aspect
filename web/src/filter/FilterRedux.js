import invariant from 'invariant'
import Immutable from 'immutable'

export const types = {
  CONFIGURE_LIST_FILTER: 'CONFIGURE_LIST_FILTER',

  CLEAR_LIST_FILTER: 'CLEAR_LIST_FILTER',
  CHANGE_LIST_FILTER: 'CHANGE_LIST_FILTER'
}
/*
 * ---------------- Action Creators -----------------
 */
export function configureListFilter(listConfig) {
  return {
    type: types.CONFIGURE_LIST_FILTER,
    listConfig
  }
}

export function clearListFilter() {
  return {
    type: types.CLEAR_LIST_FILTER
  }
}

export function changeListFilter(listFilter) {
  return {
    type: types.CHANGE_LIST_FILTER,
    listFilter
  }
}
/*
 * ---------------- Reducers -----------------
 */
const ListConfig = Immutable.Record({
  assayAndResultCategory: false,
  geography: false,
  date: false,
  deviceName: false,
  siteName: false,
  contactNameOrEmail: false,
  consumable: false
})

const ListFilter = Immutable.Record({
  assayId: undefined,
  countryId: undefined,
  stateId: undefined,
  lgaId: undefined,
  minDate: undefined,
  maxDate: undefined,
  deviceName: undefined,
  resultCategoryId: undefined,
  siteName: undefined,
  contactNameOrEmail: undefined,
  consumableId: undefined
})

const Filter = Immutable.Record({
  listConfig: new ListConfig(),
  listFilter: new ListFilter()
})

const initialState = new Filter()

export default function filterReducer(state = initialState, action) {
  switch (action.type) {
    case types.CONFIGURE_LIST_FILTER:
      return state
      .withMutations((mutState) => {
        const nextListConfig = new ListConfig(action.listConfig)
        mutState.set('listConfig', nextListConfig)

        const deleteFromMap = (a, k) => a.delete(k)

        const nextListFilter = nextListConfig
          .reduce((acc, value, key) => { // eslint-disable-line array-callback-return
            if (value) {
              return acc
            }
            switch (key) {
              case 'assayAndResultCategory':
                return ['assayId', 'resultCategoryId'].reduce(deleteFromMap, acc)
              case 'geography':
                return ['countryId', 'stateId', 'lgaId'].reduce(deleteFromMap, acc)
              case 'date':
                return ['minDate', 'maxDate'].reduce(deleteFromMap, acc)
              case 'deviceName':
              case 'siteName':
              case 'contactNameOrEmail':
                return acc.delete(key)
              case 'consumable':
                return acc.delete('consumableId')
              default:
                invariant(false, 'Unreachable')
            }
          }, state.listFilter)

        mutState.set('listFilter', nextListFilter)
      })
    case types.CLEAR_LIST_FILTER:
      return state
      .set('listFilter', initialState.listFilter)
    case types.CHANGE_LIST_FILTER:
      return state
      .mergeIn(['listFilter'], action.listFilter)
    default:
      return state
  }
}
