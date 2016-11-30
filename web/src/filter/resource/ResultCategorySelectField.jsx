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
    fetchAssays: PropTypes.func.isRequired,
    assayItems: PropTypes.object.isRequired,
    assayId: PropTypes.string,
    onResultCategoryChange: PropTypes.func.isRequired,
    value: PropTypes.string
  }

  componentDidMount() {
    this.props.fetchAssays(false)
  }

  handleChange = (event, index, value) => {
    this.props.onResultCategoryChange(value)
  }

  render() {
    const { assayItems, assayId, value } = this.props
    const restProps = _.omit(this.props, [
      'fetchAssays', 'assayItems', 'assayId', 'onResultCategoryChange', 'value'
    ])
    const possibleAssay = assayItems.find(a => a.get('id') === assayId)
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
    assayItems: state.assay.items
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
