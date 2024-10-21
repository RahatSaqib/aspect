import api from 'sinon'

// This level is used to build the tree structure of the warehouse view. Number here defines how many levels of hierarchy we want to show.
export const TREE_HIERARCHICAL_VIEW_LEVELS = 5

function buildParentHierarchy(parentWarehouseId, data, level) {
  const child = []
  if (level === 0 || !data) {
    return child
  }
  for (const [key, value] of data) {
    if (key === parentWarehouseId) {
      data.delete(key)
      for (const v of value) {
        child.push({ ...v, child: buildParentHierarchy(v.id, data, level - 1) })
      }
    }
  }
  return child
}

export function buildTheHierarchicalDataStructure(apiData) {
  if (!apiData) return { underDistribution: [], outsideDistribution: [] }
  const allIds = new Set()
  for (const value of apiData) {
    allIds.add(value.id)
  }
  const underDistribution = new Map()
  const withParentWarehouse = new Map()
  const outsideDistribution = new Map()
  // We should do full iteration to capture data that is without parentWarehouseId because we use this data during our iteration, if we are to do it single iteration we may miss out on few values.
  for (const value of apiData) {
    // Top level national warehouse is captured here, we have cases where parentWarehouseId is same as id and parentWarehouseId is not mapped to anyone, we are capturing those as well.
    if (
      (!value.parentWarehouseId || value.parentWarehouseId === value.id || !allIds.has(value.parentWarehouseId)) &&
      value.siteType === 'Warehouse'
    ) {
      underDistribution.set(value.id, { ...value, child: [] })
    } else if (value.parentWarehouseId) {
      withParentWarehouse.set(
        value.parentWarehouseId,
        [value].concat(withParentWarehouse.get(value.parentWarehouseId) || [])
      )
    } else {
      outsideDistribution.set(value.id, value)
    }
  }

  for (const [key, value] of new Map(underDistribution)) {
    underDistribution.set(key, {
      ...value,
      child: buildParentHierarchy(key, withParentWarehouse, TREE_HIERARCHICAL_VIEW_LEVELS),
    })
  }

  // If their are any values in withParentWarehouse that are not captured in underDistribution, we should push them in outsideDistribution
  for (const value of withParentWarehouse.values()) {
    for (const v of value) {
      outsideDistribution.set(v.id, v)
    }
  }

  return { underDistribution: [...underDistribution.values()], outsideDistribution: [...outsideDistribution.values()] }
}

// This function is used to get all child ids from the hierarchical data structure
export function getAllIdsFromChildren(data, level = 0) {
  const ids = []
  if (level > TREE_HIERARCHICAL_VIEW_LEVELS) return ids
  for (const value of data) {
    ids.push(value.id)
    if (value.child) {
      ids.push(...getAllIdsFromChildren(value.child, level + 1))
    }
  }
  return ids
}
