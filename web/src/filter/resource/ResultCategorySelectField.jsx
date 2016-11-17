// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

import { fetchAssays } from '../../assay/AssayRedux'

export class ResultCategorySelectField extends PureComponent {

  static propTypes = {
    assay: PropTypes.object,
    fetchAssays: PropTypes.func.isRequired,
    assayId: PropTypes.string,
    onResultCategoryChange: PropTypes.func.isRequired,
    value: PropTypes.string
  }

  handleChange = (event, index, value) => {
    this.props.onResultCategoryChange(value)
  }

  componentDidMount() {
    const {assay} = this.props
    this.props.fetchAssays(false, assay)
  }

  render() {
    const { assay, assayId, value } = this.props
    const restProps = _.omit(this.props, [
      'assay', 'fetchAssays', 'assayId', 'onResultCategoryChange', 'value'
    ])
    const possibleAssay = assay
      .items
      .find(a => a.get('id') === assayId)
    const resultCategories = possibleAssay ? possibleAssay.get('resultCategories') : []

    return (
      <SelectField
        {...restProps}
        value={value}
        onChange={this.handleChange}
      >
        {resultCategories.map(rc => (
          <MenuItem key={rc.get('id')} value={rc.get('id')} primaryText={rc.get('name')} />
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
)(ResultCategorySelectField)
