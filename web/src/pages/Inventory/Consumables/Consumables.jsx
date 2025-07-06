import { Box, Typography } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import { CheckBoxList } from '../../../cleanComponents'
import { useConsumable } from '../../../hooks/inventory/useConsumable'
import { useUpdateConsumablesBatch } from '../../../hooks/site/useUpdateConsumable'
import AspectTooltip from '../../../oldComponents/shared/AspectTooltip'
import messages from './messages'

const Consumables = ({ consumableIds, siteId, disabledSites }) => {
  const { mutateAsync: updateBatch, isLoading: isChanging } = useUpdateConsumablesBatch()
  const { data: { data: consumables } = {}, isLoading } = useConsumable()
  const { formatMessage } = useIntl()

  // Local state to track changes before sending to backend
  const [localSelectedIds, setLocalSelectedIds] = useState(consumableIds || [])
  const [debounceTimer, setDebounceTimer] = useState(null)

  // Update local state when prop changes
  useEffect(() => {
    setLocalSelectedIds(consumableIds || [])
  }, [consumableIds])

  // Debounced save function
  const debouncedSave = useCallback(
    newSelectedIds => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      const timer = setTimeout(() => {
        updateBatch({
          siteId,
          consumableIds: newSelectedIds,
        })
      }, 1000) // 1 second debounce

      setDebounceTimer(timer)
    },
    [debounceTimer, siteId, updateBatch]
  )

  const handleSelectAll = (checked, id) => {
    let newSelectedIds

    if (id) {
      // Individual item selection
      if (checked) {
        newSelectedIds = [...localSelectedIds, id]
      } else {
        newSelectedIds = localSelectedIds.filter(selectedId => selectedId !== id)
      }
    } else if (checked) {
      // Select all
      newSelectedIds = consumables
        .filter(({ id: consumableId }) => !disabledSites?.includes(consumableId))
        .map(({ id: consumableId }) => consumableId)
    } else {
      // Unselect all
      newSelectedIds = []
    }

    setLocalSelectedIds(newSelectedIds)
    debouncedSave(newSelectedIds)
  }

  return (
    <>
      <Box display="flex" alignItems="center" mb={2}>
        <Typography>{formatMessage(messages.consumablesApplicableForThisSite)}</Typography>
        <AspectTooltip showHelpIcon title={formatMessage(messages.consumablesApplicableForThisSiteTooltip)} />
      </Box>

      <CheckBoxList
        listData={consumables}
        isChanging={isChanging}
        disabledList={disabledSites}
        selectedList={localSelectedIds}
        onSelect={handleSelectAll}
        isLoading={isLoading}
      />
    </>
  )
}

export default Consumables
