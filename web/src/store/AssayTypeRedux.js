import Immutable from 'immutable'

export const types = {
  REQUEST_ASSAY_TYPES: 'REQUEST_ASSAY_TYPES',
  RECEIVE_ASSAY_TYPES: 'RECEIVE_ASSAY_TYPES',
}
export const AssayTypeItems = Immutable.Record({
  loading: false,
  items: Immutable.List([]),
  lastRefreshed: undefined,
})
export const AssayType = Immutable.Record({
  assayTypes: new AssayTypeItems(),
})
const initialState = new AssayType()

export default function assayTypeReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_ASSAY_TYPES:
      return state.setIn(['assayTypes', 'loading'], true)
    case types.RECEIVE_ASSAY_TYPES:
      return state.mergeIn(['assayTypes'], {
        loading: false,
        lastRefreshed: action.lastRefreshed,
        items: Immutable.fromJS(action.items),
      })
    default:
      return state
  }
}
