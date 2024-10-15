export const selectUnselectWarehouseAction = id => {
  return {
    type: 'SELECT_UNSELECT_LINKED_WAREHOUSE',
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
      const selectedId = action.id.split('-').map(Number)
      let { data } = state
      while (selectedId.length >= 1) {
        const id = selectedId.shift()
        data = data.find(({ id: dataId }) => dataId === id)
        data.selected = !data.selected
        data = data.child
      }
      return {
        ...state,
        data: state.data,
      }
    }
    case 'SET_INITIAL_DATA':
      return { ...state, ...action.data }
    default:
      return state
  }
}
