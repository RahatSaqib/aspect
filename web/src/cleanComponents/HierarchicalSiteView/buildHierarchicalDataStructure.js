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
  const data = new Map()
  const withParentWarehouse = new Map()
  const outsideDistribution = new Map()
  // We should do full iteration to capture data that is without parentWarehouseId because we use this data during our iteration, if we are to do it single iteration we may miss out on few values.
  for (const value of apiData) {
    // Top level national warehouse is captured here
    if (!value.parentWarehouseId && value.siteType === 'Warehouse') {
      data.set(value.id, { ...value, child: [] })
    } else if (value.parentWarehouseId) {
      withParentWarehouse.set(
        value.parentWarehouseId,
        [value].concat(withParentWarehouse.get(value.parentWarehouseId) || [])
      )
    } else {
      outsideDistribution.set(value.id, value)
    }
  }

  for (const [key, value] of new Map(data)) {
    data.set(key, { ...value, child: buildParentHierarchy(key, withParentWarehouse, 3) })
  }

  return { data: [...data.values()], outsideDistribution: [...outsideDistribution.values()] }
}
