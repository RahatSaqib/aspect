import _ from 'lodash'
import React from 'react'
import { Button } from 'react-toolbox/lib/button'
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

const enhance = _.identity

export const EmptyList = ({ intl, onClearFilters }) => (
  <div style={{ textAlign: 'center' }}>
    <p>{intl.formatMessage(messages.noResultsTitle)}</p>
    <Button
      flat
      label={intl.formatMessage(messages.clearFilters)}
      onClick={onClearFilters}
    />
  </div>
)

export default enhance(EmptyList)
