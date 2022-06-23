import filter from 'lodash/filter'
import isEqual from 'lodash/isEqual'
import isEmpty from 'lodash/isEmpty'

function handleClientSideFilterState(
  clientSideFilter,
  graphState,
  graphActions
) {
  const {
    isClientSide,
    identifier,
    selectorModifiers,
    clientSideFilters,
    clientSideFilterOptions,
    setClientSideFilterOptions,
  } = clientSideFilter
  const { id, i18nKeys, graphData, assaysFromState } = graphState
  const { formatRawData, setNewData, setFilterParams } = graphActions

  if (isClientSide) {
    const { filterFunctions } = selectorModifiers[0] || false
    const { filterFunction, shouldFilterOnServer } =
      filter(filterFunctions, { id })[0] || false
    const { val, selectAction } = clientSideFilters
    if (!isEmpty(i18nKeys) && !clientSideFilterOptions) {
      setClientSideFilterOptions({ keys: i18nKeys, assays: assaysFromState })
    }
    if (!!clientSideFilters && graphData) {
      const isRemoveOrPop = ['remove-value', 'pop-value'].includes(selectAction)

      if (shouldFilterOnServer || !filterFunction) {
        switch (true) {
          case selectAction === 'select-option':
          case isRemoveOrPop && val?.length > 0:
            setFilterParams([{ [identifier]: val.value }])
            break
          case selectAction === 'clear':
          case isRemoveOrPop && val?.length === 0:
            setFilterParams([])
            break
          default:
          /** */
        }
        return
      }

      let newData
      switch (true) {
        case selectAction === 'select-option':
          newData = filterFunction(formatRawData(), val)
          break

        case ['remove-value', 'pop-value'].includes(selectAction) &&
          val?.length > 0:
          newData = filterFunction(formatRawData(), val)
          break

        case selectAction === 'clear':
          newData = formatRawData()
          break

        case ['remove-value', 'pop-value'].includes(selectAction) &&
          val?.length < 1:
          newData = formatRawData()
          break

        default:
          newData = graphData
          break
      }

      if (!isEqual(graphData, newData)) {
        setNewData(newData)
      }
    }
  }
}

export default handleClientSideFilterState
