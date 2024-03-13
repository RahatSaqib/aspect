import React from 'react'
import { Button } from '@mui/material'
import { defineMessages, useIntl } from 'react-intl'
import { useLocation } from 'react-router'
import useFilterUpdate from '../hooks/useFilterUpdate'

const messages = defineMessages({
  noResultsTitle: { id: 'shared.EmptyList.noResultsTitle', defaultMessage: 'No results match your selected filters' },
  clearFilters: { id: 'shared.EmptyList.clearFilters', defaultMessage: 'Clear filters' },
})

const BrowseEmptyList = () => {
  const { formatMessage } = useIntl()
  const { pathname } = useLocation()
  const [, , resetFilter] = useFilterUpdate()
  return (
    <div style={{ textAlign: 'center' }}>
      <p>{formatMessage(messages.noResultsTitle)}</p>
      <Button variant="text" onClick={() => resetFilter(pathname)}>
        {formatMessage(messages.clearFilters)}
      </Button>
    </div>
  )
}

export default BrowseEmptyList
