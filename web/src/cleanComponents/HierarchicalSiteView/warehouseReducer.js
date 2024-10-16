export const initialWarehouseState = {
  underDistribution: [],
  outsideDistribution: [],
  outsideDistributionSelected: false,
  outsideDistributionSelectedSiteIds: new Set(),
  underDistributionSelectedSiteIds: new Set(),
}
export const selectUnselectLinkedWarehouseAction = siteIds => {
  return {
    type: 'SELECT_UNSELECT_LINKED_WAREHOUSE',
    siteIds,
  }
}

export function selectUnselectUnlinkedSitesAction(id) {
  return {
    type: 'SELECT_UNSELECT_UNLINKED_SITES',
    id,
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
        outsideDistributionSelectedSiteIds: new Set(),
        underDistributionSelectedSiteIds: siteIdsSet,
      }
    }
    case 'SELECT_UNSELECT_UNLINKED_SITES': {
      const { outsideDistributionSelected } = state
      const { id } = action
      return {
        ...state,
        underDistributionSelectedSiteIds: new Set(),
        outsideDistributionSelectedSiteIds:
          state.outsideDistributionSelectedSiteIds.has(id) && id ? new Set() : new Set([id].filter(Boolean)),
        outsideDistributionSelected: id ? true : !outsideDistributionSelected,
      }
    }
    case 'SET_INITIAL_DATA':
      return { ...state, ...action.data }
    default:
      return state
  }
}
