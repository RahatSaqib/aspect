// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import { fetchWorkflowStatuses } from '../../resultWorkflowStatus/ResultWorkflowStatusRedux'

export class ResultWorkflowStatusSelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    fetchWorkflowStatuses: PropTypes.func.isRequired,
    workflowStatusItems: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
    }).isRequired,
    onWorkflowStatusChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }

  static defaultProps = {
    allItemText: 'All',
    value: '',
  }

  componentDidMount() {
    this.props.fetchWorkflowStatuses(false)
  }

  handleChange = ({ target: { value } }) => {
    this.props.onWorkflowStatusChange(value === 'all' ? undefined : value)
  }

  render() {
    const { allItemText, workflowStatusItems, value } = this.props
    const restProps = _.omit(this.props, [
      'allItemText',
      'fetchWorkflowStatuses',
      'workflowStatusItems',
      'onWorkflowStatusChange',
      'value',
    ])

    return (
      <SelectField {...restProps} value={value} onChange={this.handleChange}>
        {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
        {workflowStatusItems.map(a => (
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
    workflowStatusItems: state.resultWorkflowStatus.items,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchWorkflowStatuses,
    },
    dispatch
  )
}

export default _.flowRight(connect(mapStateToProps, mapDispatchToProps))(
  ResultWorkflowStatusSelectField
)
