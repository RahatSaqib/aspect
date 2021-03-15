// Imports from packages
import omit from 'lodash/omit'
import flowRight from 'lodash/flowRight'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import { fetchWorkflowStatuses } from '../../resultWorkflowStatus/ResultWorkflowStatusRedux'
import messages from './i18n/generalMessages'
import { formatI18nMessage } from '../../shared/i18n/formatter'

export class ResultWorkflowStatusSelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    fetchWorkflowStatuses: PropTypes.func.isRequired,
    workflowStatusItems: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
      })
    ).isRequired,
    onWorkflowStatusChange: PropTypes.func.isRequired,
    value: PropTypes.string,
    intl: PropTypes.oneOfType([PropTypes.object]).isRequired,
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
    const { allItemText, workflowStatusItems, value, intl } = this.props
    const restProps = omit(this.props, [
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
            {formatI18nMessage(
              messages,
              intl.formatMessage,
              a.get('i18nKey'),
              a.get('name')
            )}
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

export default flowRight(connect(mapStateToProps, mapDispatchToProps))(
  ResultWorkflowStatusSelectField
)
