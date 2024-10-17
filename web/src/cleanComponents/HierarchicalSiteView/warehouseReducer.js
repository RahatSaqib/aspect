export const initialWarehouseState = {
  outsideDistributionSelected: false,
  outsideDistributionSelectedSiteIds: new Set(),
  underDistributionSelectedSiteIds: new Set(),
}

const actionType = {
  SELECT_UNSELECT_LINKED_WAREHOUSE: 'SELECT_UNSELECT_LINKED_WAREHOUSE',
  SELECT_UNSELECT_UNLINKED_SITES: 'SELECT_UNSELECT_UNLINKED_SITES',
}
export const selectUnselectLinkedWarehouseAction = siteIds => {
  return {
    type: actionType.SELECT_UNSELECT_LINKED_WAREHOUSE,
    siteIds,
  }
}

export function selectUnselectUnlinkedSitesAction(id) {
  return {
    type: actionType.SELECT_UNSELECT_UNLINKED_SITES,
    id,
  }
}

export function warehouseReducer(state, action) {
  switch (action.type) {
    case actionType.SELECT_UNSELECT_LINKED_WAREHOUSE: {
      const { siteIds } = action
      const siteIdsSet = new Set(siteIds)
      return {
        ...state,
        outsideDistributionSelected: false,
        outsideDistributionSelectedSiteIds: new Set(),
        underDistributionSelectedSiteIds: siteIdsSet,
      }
    }
    case actionType.SELECT_UNSELECT_UNLINKED_SITES: {
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
    default:
      return state
  }
}
