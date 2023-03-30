import React, { PureComponent } from 'react'
import { MenuItem } from '@mui/material'
import Immutable from 'immutable'
import isArray from 'lodash/isArray'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { I18nContext } from '../../../providers/I18nProvider'
import { fetchAssays } from '../../../store/AssayRedux'
import formatI18nMessage from '../../../utils/i18n/formatterWeb'
import SelectField from '../../shared/SelectField'
import messages from './i18n/generalMessages'

export class ResultCategorySelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    fetchAssays: PropTypes.func.isRequired,
    assays: PropTypes.instanceOf(Immutable.List).isRequired,
    assayId: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    onResultCategoryChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }

  static defaultProps = {
    allItemText: 'All',
    assayId: '',
    value: '',
  }

  static contextType = I18nContext

  componentDidMount() {
    this.props.fetchAssays(false)
  }

  handleChange = ({ target: { value } }) => {
    this.props.onResultCategoryChange(value === 'all' ? undefined : value)
  }

  render() {
    const { allItemText, assays, assayId, value, fetchAssays, onResultCategoryChange, ...restProps } = this.props
    const assayIdArray = isArray(assayId) ? assayId : [assayId]
    const possibleAssay = assays.toJS().find(a => assayIdArray.includes(a.id))
    const resultCategories = possibleAssay ? possibleAssay.resultCategories : []
    const { formatMessage } = this.context

    return (
      <SelectField {...restProps} value={value} onChange={this.handleChange}>
        {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
        {resultCategories.map(a => (
          <MenuItem key={a.id} value={a.id}>
            {formatI18nMessage(messages, formatMessage, a.i18nKey, a.name)}
          </MenuItem>
        ))}
      </SelectField>
    )
  }
}

export default connect(
  state => ({ assays: state.assay.items }),
  dispatch => bindActionCreators({ fetchAssays }, dispatch)
)(ResultCategorySelectField)
