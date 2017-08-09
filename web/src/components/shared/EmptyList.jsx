import _ from 'lodash'
import React from 'react'
import { defineMessages } from 'react-intl'

import Paper from 'material-ui/Paper'
import FlatButton from 'material-ui/FlatButton'

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

export const EmptyList = ({ intl, onClearFilters }) =>
  <Paper style={{ textAlign: 'center', padding: 10 }}>
    <p>
      {intl.formatMessage(messages.noResultsTitle)}
    </p>
    <FlatButton
      label={intl.formatMessage(messages.clearFilters)}
      onTouchTap={onClearFilters}
    />
  </Paper>

export default enhance(EmptyList)
