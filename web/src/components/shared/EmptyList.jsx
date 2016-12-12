// Imports from packages
import React, { PropTypes } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import {
  injectIntl,
  defineMessages
} from 'react-intl'

// Material-UI
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
  connect(false, bindActionCreators.bind(null, {
    clearListFilter
  })),
  injectIntl,
  setPropTypes({
    isEmpty: PropTypes.bool.isRequired
  }),
  pure
)

export const EmptyList = ({ isEmpty, intl, clearListFilter }) => (
  isEmpty && (
    <div style={{ textAlign: 'center' }}>
      <p>{intl.formatMessage(messages.noResultsTitle)}</p>
      <FlatButton
        label={intl.formatMessage(messages.clearFilters)}
        onTouchTap={clearListFilter}
      />
    </div>
  )
)

export default enhance(EmptyList)
