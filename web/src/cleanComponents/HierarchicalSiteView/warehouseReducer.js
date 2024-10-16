export const selectUnselectLinkedWarehouseAction = id => {
  return {
    type: 'SELECT_UNSELECT_LINKED_WAREHOUSE',
    id,
  }
}

export function selectUnselectUnlinkedSitesAction() {
  return {
    type: 'SELECT_UNSELECT_UNLINKED_SITES',
  }
}

export const loadInitialDataAction = data => {
  return {
    type: 'SET_INITIAL_DATA',
    data,
  }
}

export function warehouseReducer(state, action) {
  switch (action.type) {
    case 'SELECT_UNSELECT_LINKED_WAREHOUSE': {
      const selectedId = action.id.split('-').map(Number)
      let { underDistribution } = state
      while (selectedId.length >= 1) {
        const id = selectedId.shift()
        underDistribution = underDistribution.find(({ id: dataId }) => dataId === id)
        if (selectedId.length === 0) {
          underDistribution.selected = !underDistribution.selected
        }
        underDistribution = underDistribution.child
      }
      return {
        ...state,
        underDistribution: state.underDistribution,
      }
    }
    case 'SELECT_UNSELECT_UNLINKED_SITES': {
      const { outsideDistributionSelected } = state
      return {
        ...state,
        outsideDistributionSelected: !outsideDistributionSelected,
      }
    }
    case 'SET_INITIAL_DATA':
      return { ...state, ...action.data }
    default:
      return state
  }
}
