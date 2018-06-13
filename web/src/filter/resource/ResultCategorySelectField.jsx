// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Immutable from 'immutable'

// Material-UI
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

import { fetchAssays } from '../../assay/AssayRedux'

export class ResultCategorySelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    fetchAssays: PropTypes.func.isRequired,
    assayItems: PropTypes.instanceOf(Immutable.List).isRequired,
    assayId: PropTypes.string,
    onResultCategoryChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }

  static defaultProps = {
    allItemText: 'All',
    assayId: '',
    value: '',
  }

  componentDidMount() {
    this.props.fetchAssays(false)
  }

  handleChange = (event, index, value) => {
    this.props.onResultCategoryChange(value === 'all' ? undefined : value)
  }

  render() {
    const { allItemText, assayItems, assayId, value } = this.props
    const restProps = _.omit(this.props, [
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

    return (
      <SelectField {...restProps} value={value} onChange={this.handleChange}>
        {allItemText && <MenuItem value="all" primaryText={allItemText} />}
        {resultCategories.map(rc => (
          <MenuItem
            key={rc.get('id')}
            value={rc.get('id')}
            primaryText={rc.get('name')}
          />
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

export default _.flowRight(connect(mapStateToProps, mapDispatchToProps))(
  ResultCategorySelectField
)
