import React from 'react'
import { Button } from '@mui/material'
import { defineMessages } from 'react-intl'
import { useLocation } from 'react-router'
import useI18n from '../hooks/useI18n'
import { useFilterUpdate } from '../providers/FilterProvider'

const messages = defineMessages({
  noResultsTitle: { id: 'shared.EmptyList.noResultsTitle', defaultMessage: 'No results match your selected filters' },
  clearFilters: { id: 'shared.EmptyList.clearFilters', defaultMessage: 'Clear filters' },
})

export const BrowseEmptyList = () => {
  const { formatMessage } = useI18n()
  const location = useLocation()
  const [, , resetFilter] = useFilterUpdate()
  return (
    <div style={{ textAlign: 'center' }}>
      <p>{formatMessage(messages.noResultsTitle)}</p>
      <Button variant="text" onClick={() => resetFilter(location.pathname)}>
        {formatMessage(messages.clearFilters)}
      </Button>
    </div>
  )
}

export default BrowseEmptyList
