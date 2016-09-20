import Immutable from 'immutable'

export function receiveList(items, list) {
  const nextById = items.byId.withMutations(mutById => {
    list.forEach(item =>
      mutById.mergeDeepIn([item.get('id')], item)
    )
  })

  const nextCurrentIdList = list.map(item => item.get('id'))

  return items
    .set('byId', nextById)
    .set('currentIdList', nextCurrentIdList)
}

export const Items = Immutable.Record({
  byId: Immutable.Map(),
  currentIdList: Immutable.List()
})
