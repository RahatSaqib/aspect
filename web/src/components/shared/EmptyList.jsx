import identity from 'lodash/identity'
import React from 'react'
import Button from '@material-ui/core/Button'
import { defineMessages } from 'react-intl'
import { i18nWrapper } from '../../Providers/I18nProvider'

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
  const { formatMessage } = i18nWrapper()
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
