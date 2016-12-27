// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

import { fetchWorkflowStatuses } from '../../resultWorkflowStatus/ResultWorkflowStatusRedux'

export class ResultWorkflowStatusSelectField extends PureComponent {

  static propTypes = {
    fetchWorkflowStatuses: PropTypes.func.isRequired,
    workflowStatusItems: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string
    }).isRequired,
    onWorkflowStatusChange: PropTypes.func.isRequired,
    value: PropTypes.string
  }

  componentDidMount() {
    this.props.fetchWorkflowStatuses(false)
  }

  handleChange = (event, index, value) => {
    this.props.onWorkflowStatusChange(value)
  }

  render() {
    const { workflowStatusItems, value } = this.props
    const restProps = _.omit(this.props, [
      'fetchWorkflowStatuses', 'workflowStatusItems', 'onWorkflowStatusChange', 'value'
    ])

    return (
      <SelectField
        {...restProps}
        value={value}
        onChange={this.handleChange}
      >
        {workflowStatusItems.map(c => (
          <MenuItem key={c.get('id')} value={c.get('id')} primaryText={c.get('name')} />
        ))}
      </SelectField>
    )
  }
}

function mapStateToProps(state) {
  return {
    workflowStatusItems: state.resultWorkflowStatus.items
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchWorkflowStatuses
  }, dispatch)
}

export default _.flowRight(
  connect(mapStateToProps, mapDispatchToProps)
)(ResultWorkflowStatusSelectField)
