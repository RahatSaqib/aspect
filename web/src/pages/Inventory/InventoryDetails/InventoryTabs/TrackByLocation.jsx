import { Box } from '@mui/material'
import debounce from 'lodash/debounce'
import React, { useCallback, useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import CheckBoxList from '../../../../cleanComponents/CheckBoxList'
import { useUpdateConsumableSitesBatch } from '../../../../hooks/inventory/useUpdateConsumableSitesBatch'
import useSiteList from '../../../../hooks/site/useSiteList'

export const TrackByLocation = ({ siteIds, consumableId, disabledSites = [] }) => {
  const { data: sites = [], isLoading, error } = useSiteList()
  const updateConsumableSitesBatch = useUpdateConsumableSitesBatch()
  const { formatMessage } = useIntl()

  // Local state to track changes before sending to backend
  const [localSelectedSiteIds, setLocalSelectedSiteIds] = useState(siteIds || [])
  const [isUpdating, setIsUpdating] = useState(false)

  // Update local state when prop changes
  useEffect(() => {
    setLocalSelectedSiteIds(siteIds || [])
  }, [siteIds])

  // Debounced function to send batch updates
  const debouncedUpdate = useCallback(
    debounce(async newSiteIds => {
      if (!consumableId) return

      setIsUpdating(true)
      try {
        await updateConsumableSitesBatch.mutateAsync({
          consumableId,
          siteIds: newSiteIds,
        })
      } catch (error) {
        console.error('Failed to update sites:', error)
        // Revert local state on error
        setLocalSelectedSiteIds(siteIds || [])
      } finally {
        setIsUpdating(false)
      }
    }, 3000),
    [consumableId, updateConsumableSitesBatch, siteIds]
  )

  const handleSiteToggle = useCallback(
    (siteId, checked) => {
      const newSelectedSiteIds = checked
        ? [...localSelectedSiteIds, siteId]
        : localSelectedSiteIds.filter(id => id !== siteId)

      setLocalSelectedSiteIds(newSelectedSiteIds)
      debouncedUpdate(newSelectedSiteIds)
    },
    [localSelectedSiteIds, debouncedUpdate]
  )

  const handleSelectAll = useCallback(
    checked => {
      const availableSiteIds = sites.filter(site => !disabledSites.includes(site.id)).map(site => site.id)

      const newSelectedSiteIds = checked ? availableSiteIds : []
      setLocalSelectedSiteIds(newSelectedSiteIds)
      debouncedUpdate(newSelectedSiteIds)
    },
    [sites, disabledSites, debouncedUpdate]
  )

  const isAllSelected =
    sites.length > 0 && sites.every(site => localSelectedSiteIds.includes(site.id) || disabledSites.includes(site.id))
  const isIndeterminate = !isAllSelected && sites.some(site => localSelectedSiteIds.includes(site.id))

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
