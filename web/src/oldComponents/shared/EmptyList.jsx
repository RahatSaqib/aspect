import React from 'react'
import { Button } from '@mui/material'
import identity from 'lodash/identity'
import { defineMessages } from 'react-intl'
import useI18n from '../../hooks/useI18n'

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

const enhance = identity

export const EmptyList = ({ onClearFilters }) => {
  const { formatMessage } = useI18n()
  return (
    <div style={{ textAlign: 'center' }}>
      <p>{formatMessage(messages.noResultsTitle)}</p>
      <Button variant="text" onClick={onClearFilters}>
        {formatMessage(messages.clearFilters)}
      </Button>
    </div>
  )
}

export default enhance(EmptyList)
