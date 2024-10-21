import { buildTheHierarchicalDataStructure, getAllIdsFromChildren } from './helpers'

describe('buildTheHierarchicalDataStructure', () => {
  it('should return an empty structure when given undefined apiData', () => {
    const result = buildTheHierarchicalDataStructure()
    expect(result).toEqual({ underDistribution: [], outsideDistribution: [] })
  })

  it('should return an empty structure when given empty apiData', () => {
    const result = buildTheHierarchicalDataStructure([])
    expect(result).toEqual({ underDistribution: [], outsideDistribution: [] })
  })

  it('should correctly build a hierarchical structure with nested warehouses', () => {
    const apiData = [
      { id: 1, parentWarehouseId: null, siteType: 'Warehouse' },
      { id: 2, parentWarehouseId: 1, siteType: 'Warehouse' },
      { id: 3, parentWarehouseId: 2, siteType: 'Warehouse' },
      { id: 4, parentWarehouseId: 3, siteType: 'Warehouse' },
    ]

    const result = buildTheHierarchicalDataStructure(apiData)
    expect(result.underDistribution).toHaveLength(1)
    expect(result.underDistribution[0].id).toBe(1)
    expect(result.underDistribution[0].child).toHaveLength(1)
    expect(result.underDistribution[0].child[0].id).toBe(2)
    expect(result.underDistribution[0].child[0].child).toHaveLength(1)
    expect(result.underDistribution[0].child[0].child[0].id).toBe(3)
    expect(result.underDistribution[0].child[0].child[0].child).toHaveLength(1)
    expect(result.underDistribution[0].child[0].child[0].child[0].id).toBe(4)
  })

  it('should handle warehouses without parentWarehouseId correctly', () => {
    const apiData = [
      { id: 1, parentWarehouseId: null, siteType: 'Warehouse' },
      { id: 2, parentWarehouseId: null, siteType: 'Warehouse' },
    ]

    const result = buildTheHierarchicalDataStructure(apiData)
    expect(result.underDistribution).toHaveLength(2)
    expect(result.underDistribution[0].id).toBe(1)
    expect(result.underDistribution[1].id).toBe(2)
  })

  it('should handle non-warehouse sites correctly', () => {
    const apiData = [
      { id: 1, parentWarehouseId: null, siteType: 'Warehouse' },
      { id: 2, parentWarehouseId: 1, siteType: 'Store' },
    ]

    const result = buildTheHierarchicalDataStructure(apiData)
    expect(result.underDistribution).toHaveLength(1)
    expect(result.underDistribution[0].id).toBe(1)
    expect(result.underDistribution[0].child).toHaveLength(1)
    expect(result.underDistribution[0].child[0].id).toBe(2)
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
    expect(result.underDistribution).toHaveLength(1)
    expect(result.underDistribution[0].id).toBe(1)
    expect(result.underDistribution[0].child).toHaveLength(1)
    expect(result.underDistribution[0].child[0].id).toBe(2)
    expect(result.underDistribution[0].child[0].child).toHaveLength(1)
    expect(result.underDistribution[0].child[0].child[0].id).toBe(3)
    expect(result.underDistribution[0].child[0].child[0].child).toHaveLength(1)
    expect(result.underDistribution[0].child[0].child[0].child[0].id).toBe(4)
    expect(result.outsideDistribution).toHaveLength(0)
  })

  it('should handle a single warehouse with no children', () => {
    const apiData = [{ id: 1, parentWarehouseId: null, siteType: 'Warehouse' }]

    const result = buildTheHierarchicalDataStructure(apiData)
    expect(result.underDistribution).toHaveLength(1)
    expect(result.underDistribution[0].id).toBe(1)
    expect(result.underDistribution[0].child).toHaveLength(0)
    expect(result.outsideDistribution).toHaveLength(0)
  })

  it('should handle a warehouse with multiple children', () => {
    const apiData = [
      { id: 1, parentWarehouseId: null, siteType: 'Warehouse' },
      { id: 2, parentWarehouseId: 1, siteType: 'Warehouse' },
      { id: 3, parentWarehouseId: 1, siteType: 'Warehouse' },
    ]

    const result = buildTheHierarchicalDataStructure(apiData)
    expect(result.underDistribution).toHaveLength(1)
    expect(result.underDistribution[0].id).toBe(1)
    expect(result.underDistribution[0].child).toHaveLength(2)
    expect(result.underDistribution[0].child.some(({ id }) => id === 2)).toBe(true)
    expect(result.underDistribution[0].child.some(({ id }) => id === 3)).toBe(true)
  })

  it('should handle a warehouse with a mix of children and non-warehouse sites', () => {
    const apiData = [
      { id: 1, parentWarehouseId: null, siteType: 'Warehouse' },
      { id: 2, parentWarehouseId: 1, siteType: 'Warehouse' },
      { id: 3, parentWarehouseId: 1, siteType: 'Store' },
    ]

    const result = buildTheHierarchicalDataStructure(apiData)
    expect(result.underDistribution).toHaveLength(1)
    expect(result.underDistribution[0].id).toBe(1)
    expect(result.underDistribution[0].child).toHaveLength(2)
    expect(result.underDistribution[0].child.some(({ id }) => id === 2)).toBe(true)
    expect(result.underDistribution[0].child.some(({ id }) => id === 3)).toBe(true)
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
    expect(result.underDistribution).toHaveLength(1)
    expect(result.underDistribution[0].id).toBe(1)
    expect(result.underDistribution[0].child).toHaveLength(1)
    expect(result.underDistribution[0].child[0].id).toBe(2)
    expect(result.underDistribution[0].child[0].child).toHaveLength(1)
    expect(result.underDistribution[0].child[0].child[0].id).toBe(3)
    expect(result.outsideDistribution).toHaveLength(1)
    expect(result.outsideDistribution[0].id).toBe(4)
  })
})

describe('getAllIdsFromChildren', () => {
  it('should return an empty array when given an empty structure', () => {
    const result = getAllIdsFromChildren([])
    expect(result).toEqual([])
  })

  it('should return all ids from a single level structure', () => {
    const structure = [
      { id: 1, child: [] },
      { id: 2, child: [] },
    ]
    const result = getAllIdsFromChildren(structure)
    expect(result).toEqual([1, 2])
  })

  it('should return all ids from a nested structure', () => {
    const structure = [
      { id: 1, child: [{ id: 2, child: [{ id: 3, child: [] }] }] },
      { id: 4, child: [{ id: 5, child: [] }] },
    ]
    const result = getAllIdsFromChildren(structure)
    expect(result).toEqual([1, 2, 3, 4, 5])
  })

  it('should handle a structure with mixed levels of nesting', () => {
    const structure = [
      { id: 1, child: [{ id: 2, child: [] }] },
      { id: 3, child: [{ id: 4, child: [{ id: 5, child: [] }] }] },
    ]
    const result = getAllIdsFromChildren(structure)
    expect(result).toEqual([1, 2, 3, 4, 5])
  })

  it('should handle a structure with no children', () => {
    const structure = [{ id: 1, child: [] }]
    const result = getAllIdsFromChildren(structure)
    expect(result).toEqual([1])
  })

  it('should handle a structure with multiple children at different levels', () => {
    const structure = [
      {
        id: 1,
        child: [
          {
            id: 2,
            child: [
              { id: 3, child: [] },
              { id: 4, child: [] },
            ],
          },
        ],
      },
      { id: 5, child: [{ id: 6, child: [] }] },
    ]
    const result = getAllIdsFromChildren(structure)
    expect(result).toEqual([1, 2, 3, 4, 5, 6])
  })
})
