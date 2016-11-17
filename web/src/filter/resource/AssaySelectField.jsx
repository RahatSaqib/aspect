// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

import { fetchAssays } from '../../assay/AssayRedux'

export class AssaySelectField extends PureComponent {

  static propTypes = {
    fetchAssays: PropTypes.func.isRequired,
    assay: PropTypes.object,
    onAssayChange: PropTypes.func.isRequired,
    value: PropTypes.string
  }

  componentDidMount() {
    const { assay } = this.props
    this.props.fetchAssays(false, assay)
  }

  handleChange = (event, index, value) => {
    this.props.onAssayChange(value)
  }

  render() {
    const { assay, value } = this.props
    const restProps = _.omit(this.props, [
      'fetchAssays', 'assay', 'onAssayChange', 'value'
    ])
    const validAssays = assay ? assay.items.filter(a => a.get('hasResults')) : []

    return (
      <SelectField
        {...restProps}
        value={value}
        onChange={this.handleChange}
      >
        {validAssays.map(a => (
          <MenuItem key={a.get('id')} value={a.get('id')} primaryText={a.get('name')} />
        ))}
      </SelectField>
    )
  }
}

function mapStateToProps(state) {
  return {
    assay: state.assay
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchAssays
  }, dispatch)
}

export default _.flowRight(
  connect(mapStateToProps, mapDispatchToProps)
)(AssaySelectField)
