import _ from 'lodash'
import Immutable from 'immutable'

function rowSpans(item, nestedPropertyPath, numberOfChildren) {
  const fields = _.difference(Object.keys(item), nestedPropertyPath)
  return _.zipObject(fields, _.map(fields, () => numberOfChildren + 1))
}

function transformItem(item, nestedPropertyPath) {
  const nextChildrenProperty = _.head(nestedPropertyPath)
  if(nextChildrenProperty) {
    const nestedChildren = _.flattenDeep(_.map(item[nextChildrenProperty], item => {
      return transformItem(item, _.without(nestedPropertyPath, nextChildrenProperty))
    }))
    if(_.isEmpty(nestedChildren)) {
      return {..._.omit(item, nextChildrenProperty), rowSpans: rowSpans(item, nestedPropertyPath, 0)}
    } else {
      return [
        {..._.omit(item, nextChildrenProperty), ...nestedChildren[0],
          rowSpans: {...rowSpans(item, nestedPropertyPath, nestedChildren.length - 1), ...nestedChildren[0].rowSpans}},
        ..._.drop(nestedChildren)]
    }
  } else {
    return {...item, rowSpans: rowSpans(item, nestedPropertyPath, 0)}
  }
}

export function receiveList(items, nestedPropertyPath, nestedList) {
  const list = _.flattenDeep(_.map(nestedList, item => {
    return transformItem(item, nestedPropertyPath)
  }))

  const immutableList = Immutable.fromJS(list)

  const nextById = items.byId.withMutations(mutById => {
    immutableList.forEach(item =>
      mutById.mergeDeepIn([item.get('id')], item)
    )
  })

  const nextCurrentIdList = immutableList.map(item => item.get('id'))

  return items
    .set('byId', nextById)
    .set('currentIdList', nextCurrentIdList)
}

export const Items = Immutable.Record({
  byId: Immutable.Map(),
  currentIdList: Immutable.List()
})
