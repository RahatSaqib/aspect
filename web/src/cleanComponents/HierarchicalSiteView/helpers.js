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
  const underDistribution = new Map()
  const withParentWarehouse = new Map()
  const outsideDistribution = new Map()
  // We should do full iteration to capture data that is without parentWarehouseId because we use this data during our iteration, if we are to do it single iteration we may miss out on few values.
  for (const value of apiData) {
    // Top level national warehouse is captured here, we have cases where parentWarehouseId is same as id, we are capturing those as well.
    if ((!value.parentWarehouseId || value.parentWarehouseId === value.id) && value.siteType === 'Warehouse') {
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
    underDistribution.set(key, { ...value, child: buildParentHierarchy(key, withParentWarehouse, 3) })
  }

  return { underDistribution: [...underDistribution.values()], outsideDistribution: [...outsideDistribution.values()] }
}

export function getAllIdsFromChildren(data, level = 0) {
  const ids = []
  if (level >= 4) return ids
  for (const value of data) {
    ids.push(value.id)
    if (value.child) {
      ids.push(...getAllIdsFromChildren(value.child, level + 1))
    }
  }
  return ids
}
