import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useIntl } from 'react-intl'
import { toast } from 'react-toastify'
import { CheckBoxList } from '../../../components'
import AspectTooltip from '../../../components/shared/AspectTooltip'
import { useConsumable } from '../../../hooks/inventory/useConsumable'
import { useUpdateConsumablesBatch } from '../../../hooks/site/useUpdateConsumable'
import messages from './messages'

const ConsumablesBySite = ({ consumableIds, siteId, fixedConsumables = [] }) => {
  const { mutateAsync: updateBatch, isLoading: isChanging } = useUpdateConsumablesBatch()
  const { data: { data: consumables } = {}, isLoading } = useConsumable()
  const { formatMessage } = useIntl()

  // Local state to track changes before sending to backend
  const [localSelectedIds, setLocalSelectedIds] = useState(consumableIds || [])
  const debounceTimer = useRef(null)

  // Update local state when prop changes
  useEffect(() => {
    setLocalSelectedIds(consumableIds || [])
  }, [consumableIds])

  // Debounced save function
  const debouncedSave = useCallback(
    newSelectedIds => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      const timer = setTimeout(async () => {
        try {
          await updateBatch({
            siteId,
            consumableIds: newSelectedIds,
          })
          toast.success(formatMessage(messages.consumablesUpdatedSuccessfully))
        } catch (error) {
          toast.error(formatMessage(messages.errorUpdatingConsumables))
          // Revert local state on error
          setLocalSelectedIds(consumableIds || [])
        }
      }, 1500) // debounce time

      debounceTimer.current = timer
    },
    [siteId, updateBatch, formatMessage, consumableIds]
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
      newSelectedIds = consumables.map(({ id: consumableId }) => consumableId)
    } else {
      // Unselect all
      newSelectedIds = fixedConsumables
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
        disabledList={fixedConsumables}
        selectedList={localSelectedIds}
        onSelect={handleSelectAll}
        isLoading={isLoading}
      />
    </>
  )
}

export default ConsumablesBySite
