import Immutable from 'immutable'

export function requestSelectList(selectList) {
  return selectList.merge({
    loading: true
  })
}

export function receiveSelectList(selectList, items) {
  return selectList.merge({
    loading: false,
    items
  })
}

export const SelectList = Immutable.Record({
  loading: false,
  items: Immutable.List()
})
