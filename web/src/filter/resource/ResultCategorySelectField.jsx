// Imports from packages
import omit from 'lodash/omit'
import flowRight from 'lodash/flowRight'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Immutable from 'immutable'
// Material-UI
import MenuItem from '@material-ui/core/MenuItem'

import messages from './i18n/generalMessages'
import SelectField from '../../components/shared/SelectField'
import { fetchAssays } from '../../assay/AssayRedux'

export class ResultCategorySelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    fetchAssays: PropTypes.func.isRequired,
    assayItems: PropTypes.instanceOf(Immutable.List).isRequired,
    assayId: PropTypes.string,
    onResultCategoryChange: PropTypes.func.isRequired,
    value: PropTypes.string,
    intl: PropTypes.oneOfType([PropTypes.object]).isRequired,
  }

  static defaultProps = {
    allItemText: 'All',
    assayId: '',
    value: '',
  }

  componentDidMount() {
    this.props.fetchAssays(false)
  }

  handleChange = ({ target: { value } }) => {
    this.props.onResultCategoryChange(value === 'all' ? undefined : value)
  }

  render() {
    const { allItemText, assayItems, assayId, value, intl } = this.props
    const restProps = omit(this.props, [
      'allItemText',
      'fetchAssays',
      'assayItems',
      'assayId',
      'onResultCategoryChange',
      'value',
    ])
    const possibleAssay = assayItems.find(a => a.get('id') === assayId)
    const resultCategories = possibleAssay
      ? possibleAssay.get('resultCategories')
      : []
    const textForItem = item => {
      return messages[item.get('i18nKey')]
        ? intl.formatMessage(messages[item.get('i18nKey')])
        : item.get('name')
    }

    return (
      <SelectField {...restProps} value={value} onChange={this.handleChange}>
        {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
        {resultCategories.map(a => (
          <MenuItem key={a.get('id')} value={a.get('id')}>
            {textForItem(a)}
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

export default flowRight(connect(mapStateToProps, mapDispatchToProps))(
  ResultCategorySelectField
)
