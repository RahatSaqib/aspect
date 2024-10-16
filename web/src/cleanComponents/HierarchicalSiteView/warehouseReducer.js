export const initialWarehouseState = {
  underDistribution: [],
  outsideDistribution: [],
  outsideDistributionSelected: false,
  underDistributionSelectedSiteIds: new Set(),
}
export const selectUnselectLinkedWarehouseAction = siteIds => {
  return {
    type: 'SELECT_UNSELECT_LINKED_WAREHOUSE',
    siteIds,
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
      const { siteIds } = action
      const siteIdsSet = new Set(siteIds)
      return {
        ...state,
        outsideDistributionSelected: false,
        underDistributionSelectedSiteIds: siteIdsSet,
      }
    }
    case 'SELECT_UNSELECT_UNLINKED_SITES': {
      const { outsideDistributionSelected } = state
      return {
        ...state,
        underDistributionSelectedSiteIds: new Set(),
        outsideDistributionSelected: !outsideDistributionSelected,
      }
    }
    case 'SET_INITIAL_DATA':
      return { ...state, ...action.data }
    default:
      return state
  }
}
