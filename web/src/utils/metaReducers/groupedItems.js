import Immutable from 'immutable'
import difference from 'lodash/difference'
import drop from 'lodash/drop'
import flattenDeep from 'lodash/flattenDeep'
import head from 'lodash/head'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import omit from 'lodash/omit'
import without from 'lodash/without'
import zipObject from 'lodash/zipObject'

function rowSpans(item, excludeProperties, numberOfChildren) {
  const includedProperties = difference(Object.keys(item), excludeProperties)
  return zipObject(
    includedProperties,
    map(includedProperties, () => numberOfChildren + 1)
  )
}

function flattenItem(item, childrenPropertyPath) {
  const childrenPropertyName = head(childrenPropertyPath)
  if (childrenPropertyName) {
    const children = flattenDeep(
      map(item[childrenPropertyName], item => flattenItem(item, without(childrenPropertyPath, childrenPropertyName)))
    )
    if (isEmpty(children)) {
      return {
        ...omit(item, childrenPropertyName),
        rowSpans: rowSpans(item, childrenPropertyPath, 0),
      }
    }
    const flatParentItemWithFirstChild = {
      ...omit(item, childrenPropertyName),
      ...children[0],
    }
    const parentRowSpans = {
      ...rowSpans(item, childrenPropertyPath, children.length - 1),
      ...children[0].rowSpans,
    }
    const flatParentItem = {
      ...flatParentItemWithFirstChild,
      rowSpans: parentRowSpans,
      visibleProperties: without(Object.keys(flatParentItemWithFirstChild), 'rowSpans', 'visibleProperties'),
    }
    const childrenWithParentProperties = map(drop(children), child => {
      const rowSpans = {
        ...parentRowSpans,
        ...child.rowSpans,
      }
      const visibleProperties = without(Object.keys(child), 'rowSpans', 'visibleProperties')
      return {
        visibleProperties,
        ...flatParentItem,
        ...child,
        rowSpans,
      }
    })
    return [flatParentItem, ...childrenWithParentProperties]
  }
  return {
    ...item,
    rowSpans: rowSpans(item, childrenPropertyPath, 0),
    visibleProperties: without(Object.keys(item), 'rowSpans', 'visibleProperties'),
  }
}

export function receiveList(items, childrenPropertyPath, listOfTreeObjects) {
  const list = flattenDeep(map(listOfTreeObjects, item => flattenItem(item, childrenPropertyPath)))

  const immutableList = Immutable.fromJS(list)

  const nextById = items.byId.withMutations(mutById => {
    immutableList.forEach(item => mutById.mergeIn([item.get('id')], item))
  })

  const nextCurrentIdList = immutableList.map(item => item.get('id'))

  return items.set('byId', nextById).set('currentIdList', nextCurrentIdList)
}

export const Items = Immutable.Record({
  byId: Immutable.Map(),
  currentIdList: Immutable.List(),
})
