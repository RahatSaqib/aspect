import React from 'react'
import { Button } from '@mui/material'
import { defineMessages } from 'react-intl'
import { useLocation } from 'react-router'
import useI18n from '../hooks/useI18n'
import { useFilterUpdate } from '../providers/FilterProvider'

const messages = defineMessages({
  noResultsTitle: { id: 'shared.EmptyList.noResultsTitle', defaultMessage: 'No results match your selected filters' },
  clearFilters: { id: 'shared.EmptyList.clearFilters', defaultMessage: 'Clear filters' },
  loading: { id: 'shared.EmptyList.loading', defaultMessage: 'Loading...' },
})

export const BrowseEmptyList = ({ isLoadingData }) => {
  const { formatMessage } = useI18n()
  const location = useLocation()
  const [, , resetFilter] = useFilterUpdate()
  const text = isLoadingData ? formatMessage(messages.loading) : formatMessage(messages.noResultsTitle)
  return (
    <div style={{ textAlign: 'center' }}>
      <p>{text}</p>
      {!isLoadingData && (
        <Button variant="text" onClick={() => resetFilter(location.pathname)}>
          {formatMessage(messages.clearFilters)}
        </Button>
      )}
    </div>
  )
}

export default BrowseEmptyList
