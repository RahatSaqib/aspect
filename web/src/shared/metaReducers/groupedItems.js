import _ from 'lodash'
import Immutable from 'immutable'

function rowSpans(item, excludeProperties, numberOfChildren) {
  const includedProperties = _.difference(Object.keys(item), excludeProperties)
  return _.zipObject(includedProperties, _.map(includedProperties, () => numberOfChildren + 1))
}

function flattenItem(item, childrenPropertyPath) {
  const childrenPropertyName = _.head(childrenPropertyPath)
  if (childrenPropertyName) {
    const children = _.flattenDeep(_.map(item[childrenPropertyName],
      item => flattenItem(item, _.without(childrenPropertyPath, childrenPropertyName))))
    if (_.isEmpty(children)) {
      return {
        ..._.omit(item, childrenPropertyName),
        rowSpans: rowSpans(item, childrenPropertyPath, 0)
      }
    }
    const flatParentItemWithFirstChild = {
      ..._.omit(item, childrenPropertyName),
      ...children[0]
    }
    const parentRowSpans = {
      ...rowSpans(item, childrenPropertyPath, children.length - 1),
      ...children[0].rowSpans
    }
    const flatParentItem = {
      ...flatParentItemWithFirstChild,
      rowSpans: parentRowSpans,
      visibleProperties: _.without(Object.keys(flatParentItemWithFirstChild), 'rowSpans', 'visibleProperties')
    }
    const childrenWithParentProperties = _.map(_.drop(children), (child) => {
      const rowSpans = {
        ...parentRowSpans,
        ...child.rowSpans
      }
      const visibleProperties = _.without(Object.keys(child), 'rowSpans', 'visibleProperties')
      return {
        visibleProperties,
        ...flatParentItem,
        ...child,
        rowSpans
      }
    })
    return [flatParentItem, ...childrenWithParentProperties]
  }
  return {
    ...item,
    rowSpans: rowSpans(item, childrenPropertyPath, 0),
    visibleProperties: _.without(Object.keys(item), 'rowSpans', 'visibleProperties')
  }
}

export function receiveList(items, childrenPropertyPath, listOfTreeObjects) {
  const list = _.flattenDeep(
    _.map(listOfTreeObjects, item => flattenItem(item, childrenPropertyPath)))

  const immutableList = Immutable.fromJS(list)

  const nextById = items.byId.withMutations((mutById) => {
    immutableList.forEach(item =>
      mutById.mergeIn([item.get('id')], item)
    )
  })

  const nextCurrentIdList = immutableList.map(item => item.get('id'))

  return items
    .set('byId', nextById)
    .set('currentIdList', nextCurrentIdList)
}

export function receiveItem(items, childrenPropertyPath, nestedItem) {
  const flattenedItem = Immutable.fromJS(
    _.head(_.flattenDeep(flattenItem(nestedItem, childrenPropertyPath))))
  const existingItem = items.getIn(['byId', flattenedItem.get('id')])
  if (existingItem) {
    return items.mergeDeepIn(['byId', flattenedItem.get('id')], flattenedItem.merge({
      rowSpans: existingItem.get('rowSpans'),
      visibleProperties: existingItem.get('visibleProperties')
    }))
  }
  return items.mergeDeepIn(['byId', flattenedItem.get('id')], Immutable.fromJS(flattenedItem))
}

export const Items = Immutable.Record({
  byId: Immutable.Map(),
  currentIdList: Immutable.List()
})
