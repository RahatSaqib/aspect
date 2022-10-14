import React from 'react'
import { Button } from '@mui/material'
import { defineMessages } from 'react-intl'
import { useLocation, useNavigate } from 'react-router'
import useI18n from '../hooks/useI18n'

const messages = defineMessages({
  noResultsTitle: {
    id: 'shared.EmptyList.noResultsTitle',
    defaultMessage: 'No results match your selected filters',
  },
  clearFilters: {
    id: 'shared.EmptyList.clearFilters',
    defaultMessage: 'Clear filters',
  },
})

export const BrowseEmptyList = () => {
  const { formatMessage } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()

  const onClearFilters = () => {
    const searchParams = new URLSearchParams(location.search)
    for (const key of searchParams.keys()) {
      searchParams.delete(key)
    }
    navigate({ ...location, search: `?${searchParams.toString()}` }, { replace: true })
  }
  return (
    <div style={{ textAlign: 'center' }}>
      <p>{formatMessage(messages.noResultsTitle)}</p>
      <Button variant="text" onClick={onClearFilters}>
        {formatMessage(messages.clearFilters)}
      </Button>
    </div>
  )
}

export default BrowseEmptyList
