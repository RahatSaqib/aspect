// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Immutable from 'immutable'
import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import { fetchAssays } from '../../assay/AssayRedux'

export class AssaySelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    fetchAssays: PropTypes.func.isRequired,
    assayItems: PropTypes.instanceOf(Immutable.List).isRequired,
    onAssayChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }

  static defaultProps = {
    allItemText: 'All',
    value: '',
  }

  componentDidMount() {
    this.props.fetchAssays(false)
  }

  handleChange = ({ target: { value } }) => {
    this.props.onAssayChange(value === 'all' ? undefined : value)
  }

  render() {
    const { allItemText, assayItems, value } = this.props
    const restProps = _.omit(this.props, [
      'allItemText',
      'fetchAssays',
      'assayItems',
      'onAssayChange',
      'value',
    ])
    const validAssays = assayItems.filter(a => a.get('hasResults'))

    return (
      <SelectField {...restProps} value={value} onChange={this.handleChange}>
        {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
        {validAssays.map(a => (
          <MenuItem key={a.get('id')} value={a.get('id')}>
            {a.get('name')}
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

export default _.flowRight(connect(mapStateToProps, mapDispatchToProps))(
  AssaySelectField
)
