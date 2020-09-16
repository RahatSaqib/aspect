/*
  This is a generic reducer for a list of items
  where individual items can be updated with additional data
*/
import flowRight from 'lodash/flowRight'
import Immutable from 'immutable'

export function receiveList(items, list) {
  const nextById = items.byId.withMutations(mutById => {
    list.forEach(item => mutById.mergeDeepIn([item.get('id')], item))
  })

  const nextCurrentIdList = list.map(item => item.get('id'))

  return items.set('byId', nextById).set('currentIdList', nextCurrentIdList)
}

export function receiveItem(items, item) {
  return items.mergeDeepIn(['byId', item.get('id')], item)
}

export const Items = Immutable.Record({
  byId: Immutable.Map(),
  currentIdList: Immutable.List(),
})

export const makeItems = flowRight(Items, Immutable.fromJS)
