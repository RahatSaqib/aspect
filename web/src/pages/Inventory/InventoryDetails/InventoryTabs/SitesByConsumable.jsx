import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import { useIntl } from 'react-intl'
import { toast } from 'react-toastify'
import CheckBoxList from '../../../../cleanComponents/CheckBoxList'
import { useUpdateConsumableSitesBatch } from '../../../../hooks/inventory/useUpdateConsumableSitesBatch'
import useSiteList from '../../../../hooks/site/useSiteList'
import messages from './messages'

export const SitesByConsumable = ({ siteIds, consumableId, disabledSites = [] }) => {
  const { data: sites = [], isLoading, error } = useSiteList()
  const updateConsumableSitesBatch = useUpdateConsumableSitesBatch()
  const { formatMessage } = useIntl()
  const debounceTimer = useRef(null)

  // Local state to track changes before sending to backend
  const [localSelectedSiteIds, setLocalSelectedSiteIds] = useState(siteIds || [])
  const [isUpdating, setIsUpdating] = useState(false)

  // Update local state when prop changes
  useEffect(() => {
    setLocalSelectedSiteIds(siteIds || [])
  }, [siteIds])

  // Debounced save function
  const debouncedSave = useCallback(
    newSiteIds => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      const timer = setTimeout(async () => {
        // Get current values at the time of execution
        const currentConsumableId = consumableId
        const currentSiteIds = siteIds || []

        if (!currentConsumableId) return

        setIsUpdating(true)
        try {
          await updateConsumableSitesBatch.mutateAsync({
            consumableId: currentConsumableId,
            siteIds: newSiteIds,
          })
          toast.success(formatMessage(messages.sitesUpdatedSuccessfully))
        } catch (error) {
          toast.error(formatMessage(messages.errorUpdatingSites))
          console.error('Failed to update sites:', error)
          // Revert local state on error
          setLocalSelectedSiteIds(currentSiteIds)
        } finally {
          setIsUpdating(false)
        }
      }, 1500) // debounce time

      debounceTimer.current = timer
    },
    [consumableId, siteIds, updateConsumableSitesBatch, formatMessage]
  )

  const handleSiteToggle = useCallback(
    (siteId, checked) => {
      const newSelectedSiteIds = checked
        ? [...localSelectedSiteIds, siteId]
        : localSelectedSiteIds.filter(id => id !== siteId)

      setLocalSelectedSiteIds(newSelectedSiteIds)
      debouncedSave(newSelectedSiteIds)
    },
    [localSelectedSiteIds, debouncedSave]
  )

  const handleSelectAll = useCallback(
    checked => {
      const availableSiteIds = sites.map(site => site.id)

      const newSelectedSiteIds = checked ? availableSiteIds : disabledSites
      setLocalSelectedSiteIds(newSelectedSiteIds)
      debouncedSave(newSelectedSiteIds)
    },
    [sites, disabledSites, debouncedSave]
  )

  return (
    <>
      <Box display="flex" alignItems="center" mb={2}>
        <span>Track this consumable at the following sites:</span>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" p={2}>
          <span>Loading sites...</span>
        </Box>
      ) : error ? (
        <Box display="flex" justifyContent="center" p={2}>
          <span>Error loading sites: {error.message}</span>
        </Box>
      ) : (
        <CheckBoxList
          listData={sites}
          selectedList={localSelectedSiteIds}
          onSelect={(checked, siteId) => {
            if (siteId) {
              handleSiteToggle(siteId, checked)
            } else {
              handleSelectAll(checked)
            }
          }}
          disabledList={disabledSites}
          isChanging={updateConsumableSitesBatch.isLoading || isUpdating}
          isLoading={false}
        />
      )}
    </>
  )
}
