// Imports from packages
import React from 'react'
import { compose, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import {
  injectIntl,
  defineMessages
} from 'react-intl'

// Material-UI
import Paper from 'material-ui/Paper'
import FlatButton from 'material-ui/FlatButton'

// Our own imports
import {
  clearListFilter
} from '../../filter/FilterRedux'

const messages = defineMessages({
  noResultsTitle: {
    id: 'shared.EmptyList.noResultsTitle',
    defaultMessage: 'No results match your selected filters'
  },
  clearFilters: {
    id: 'shared.EmptyList.clearFilters',
    defaultMessage: 'Clear filters'
  }
})

const enhance = compose(
  pure,
  injectIntl,
  connect(false, bindActionCreators.bind(null, {
    clearListFilter
  }))
)

export const EmptyList = ({ intl, clearListFilter }) => (
  <Paper style={{ textAlign: 'center', padding: 10 }}>
    <p>{intl.formatMessage(messages.noResultsTitle)}</p>
    <FlatButton
      label={intl.formatMessage(messages.clearFilters)}
      onTouchTap={clearListFilter}
    />
  </Paper>
)

export default enhance(EmptyList)
