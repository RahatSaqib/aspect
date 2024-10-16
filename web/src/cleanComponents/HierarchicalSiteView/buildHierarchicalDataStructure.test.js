import { buildTheHierarchicalDataStructure } from './buildHierarchicalDataStructure'

describe('buildTheHierarchicalDataStructure', () => {
  it('should return an empty structure when given empty apiData', () => {
    const result = buildTheHierarchicalDataStructure([])
    expect(result).toEqual({ data: [], outsideDistribution: [] })
  })

  it('should correctly build a hierarchical structure with nested warehouses', () => {
    const apiData = [
      { id: 1, parentWarehouseId: null, siteType: 'Warehouse' },
      { id: 2, parentWarehouseId: 1, siteType: 'Warehouse' },
      { id: 3, parentWarehouseId: 2, siteType: 'Warehouse' },
      { id: 4, parentWarehouseId: 3, siteType: 'Warehouse' },
    ]

    const result = buildTheHierarchicalDataStructure(apiData)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].id).toBe(1)
    expect(result.data[0].child).toHaveLength(1)
    expect(result.data[0].child[0].id).toBe(2)
    expect(result.data[0].child[0].child).toHaveLength(1)
    expect(result.data[0].child[0].child[0].id).toBe(3)
    expect(result.data[0].child[0].child[0].child).toHaveLength(1)
    expect(result.data[0].child[0].child[0].child[0].id).toBe(4)
  })

  it('should handle warehouses without parentWarehouseId correctly', () => {
    const apiData = [
      { id: 1, parentWarehouseId: null, siteType: 'Warehouse' },
      { id: 2, parentWarehouseId: null, siteType: 'Warehouse' },
    ]

    const result = buildTheHierarchicalDataStructure(apiData)
    expect(result.data).toHaveLength(2)
    expect(result.data[0].id).toBe(1)
    expect(result.data[1].id).toBe(2)
  })

  it('should handle non-warehouse sites correctly', () => {
    const apiData = [
      { id: 1, parentWarehouseId: null, siteType: 'Warehouse' },
      { id: 2, parentWarehouseId: 1, siteType: 'Store' },
    ]

    const result = buildTheHierarchicalDataStructure(apiData)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].id).toBe(1)
    expect(result.data[0].child).toHaveLength(1)
    expect(result.data[0].child[0].id).toBe(2)
    expect(result.outsideDistribution).toHaveLength(0)
  })

  it('should handle mixed site types correctly', () => {
    const apiData = [
      { id: 1, parentWarehouseId: null, siteType: 'Warehouse' },
      { id: 2, parentWarehouseId: 1, siteType: 'Warehouse' },
      { id: 3, parentWarehouseId: 2, siteType: 'Store' },
      { id: 4, parentWarehouseId: 3, siteType: 'Warehouse' }, // This should be possible ideally. But because we are not having any validations on it, i'm validating this condition as well
    ]

    const result = buildTheHierarchicalDataStructure(apiData)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].id).toBe(1)
    expect(result.data[0].child).toHaveLength(1)
    expect(result.data[0].child[0].id).toBe(2)
    expect(result.data[0].child[0].child).toHaveLength(1)
    expect(result.data[0].child[0].child[0].id).toBe(3)
    expect(result.data[0].child[0].child[0].child).toHaveLength(1)
    expect(result.data[0].child[0].child[0].child[0].id).toBe(4)
    expect(result.outsideDistribution).toHaveLength(0)
  })

  it('should handle a single warehouse with no children', () => {
    const apiData = [{ id: 1, parentWarehouseId: null, siteType: 'Warehouse' }]

    const result = buildTheHierarchicalDataStructure(apiData)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].id).toBe(1)
    expect(result.data[0].child).toHaveLength(0)
    expect(result.outsideDistribution).toHaveLength(0)
  })

  it('should handle a warehouse with multiple children', () => {
    const apiData = [
      { id: 1, parentWarehouseId: null, siteType: 'Warehouse' },
      { id: 2, parentWarehouseId: 1, siteType: 'Warehouse' },
      { id: 3, parentWarehouseId: 1, siteType: 'Warehouse' },
    ]

    const result = buildTheHierarchicalDataStructure(apiData)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].id).toBe(1)
    expect(result.data[0].child).toHaveLength(2)
    expect(result.data[0].child.some(({ id }) => id === 2)).toBe(true)
    expect(result.data[0].child.some(({ id }) => id === 3)).toBe(true)
  })

  it('should handle a warehouse with a mix of children and non-warehouse sites', () => {
    const apiData = [
      { id: 1, parentWarehouseId: null, siteType: 'Warehouse' },
      { id: 2, parentWarehouseId: 1, siteType: 'Warehouse' },
      { id: 3, parentWarehouseId: 1, siteType: 'Store' },
    ]

    const result = buildTheHierarchicalDataStructure(apiData)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].id).toBe(1)
    expect(result.data[0].child).toHaveLength(2)
    expect(result.data[0].child.some(({ id }) => id === 2)).toBe(true)
    expect(result.data[0].child.some(({ id }) => id === 3)).toBe(true)
    expect(result.outsideDistribution).toHaveLength(0)
  })

  it('should handle outsideDistribution values correctly', () => {
    const apiData = [
      { id: 1, parentWarehouseId: null, siteType: 'Warehouse' },
      { id: 2, parentWarehouseId: 1, siteType: 'Warehouse' },
      { id: 3, parentWarehouseId: 2, siteType: 'Warehouse' },
      { id: 4, parentWarehouseId: null, siteType: 'Lab' },
    ]

    const result = buildTheHierarchicalDataStructure(apiData)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].id).toBe(1)
    expect(result.data[0].child).toHaveLength(1)
    expect(result.data[0].child[0].id).toBe(2)
    expect(result.data[0].child[0].child).toHaveLength(1)
    expect(result.data[0].child[0].child[0].id).toBe(3)
    expect(result.outsideDistribution).toHaveLength(1)
    expect(result.outsideDistribution[0].id).toBe(4)
  })
})
