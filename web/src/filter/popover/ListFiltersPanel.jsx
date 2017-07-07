import _ from 'lodash'
import Immutable from 'immutable'
import { compose, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { injectIntl } from 'react-intl'

import {
  exportFormatTypes,
  clearListFilter,
  changeListFilter,
  askExportConfirmation,
  closeExportConfirmation,
  beginListExportProcessing,
} from '../FilterRedux'
import FiltersPanel from './FiltersPanel'

const enhance = compose(
  pure,
  injectIntl,
  connect(
    state => ({
      config: state.filter.listConfig,
      filters: state.filter.listFilter,
      listExport: state.filter.listExport,
      exportFormatTypes,
    }),
    bindActionCreators.bind(null, {
      onClearFilter: clearListFilter,
      onChangeFilter: _.flowRight(changeListFilter, Immutable.fromJS),

      askExportConfirmation,
      closeExportConfirmation,
      beginListExportProcessing,
    })
  )
)

export default enhance(FiltersPanel)
