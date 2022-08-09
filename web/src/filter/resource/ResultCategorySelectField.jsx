import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import isArray from 'lodash/isArray'
import omit from 'lodash/omit'
import flowRight from 'lodash/flowRight'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Immutable from 'immutable'
import MenuItem from '@mui/material/MenuItem'

import messages from './i18n/generalMessages'
import SelectField from '../../components/shared/SelectField'
import { fetchAssays } from '../../assay/AssayRedux'
import formatI18nMessage from '../../shared/i18n/formatterWeb'
import { I18nContext } from '../../Providers/I18nProvider'

export class ResultCategorySelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    fetchAssays: PropTypes.func.isRequired,
    assayItems: PropTypes.instanceOf(Immutable.List).isRequired,
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
    const { allItemText, assayItems, assayId, value } = this.props
    const restProps = omit(this.props, [
      'allItemText',
      'fetchAssays',
      'assayItems',
      'assayId',
      'onResultCategoryChange',
      'value',
    ])
    const assayIds = isArray(assayId) ? assayId : [assayId]
    const possibleAssay = assayItems.find(a => assayIds.includes(a.get('id')))
    const resultCategories = possibleAssay ? possibleAssay.get('resultCategories') : []
    const { formatMessage } = this.context

    return (
      <SelectField {...restProps} value={value} onChange={this.handleChange}>
        {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
        {resultCategories &&
          resultCategories.map(a => (
            <MenuItem key={a.get('id')} value={a.get('id')}>
              {formatI18nMessage(messages, formatMessage, a.get('i18nKey'), a.get('name'))}
            </MenuItem>
          ))}
      </SelectField>
    )
  }
}

function mapStateToProps(state) {
  return {
    assayItems: state.assay.items,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchAssays,
    },
    dispatch
  )
}

export default flowRight(connect(mapStateToProps, mapDispatchToProps))(ResultCategorySelectField)
