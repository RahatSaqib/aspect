import identity from 'lodash/identity'
import React from 'react'
import Button from '@material-ui/core/Button'
import { defineMessages } from 'react-intl'

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

export const EmptyList = ({ intl, onClearFilters }) => (
  <div style={{ textAlign: 'center' }}>
    <p>{intl.formatMessage(messages.noResultsTitle)}</p>
    <Button variant="text" onClick={onClearFilters}>
      {intl.formatMessage(messages.clearFilters)}
    </Button>
  </div>
)

export default enhance(EmptyList)
