import React, { PureComponent } from 'react'
import MenuItem from '@mui/material/MenuItem'
import Immutable from 'immutable'
import flowRight from 'lodash/flowRight'
import omit from 'lodash/omit'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { I18nContext } from '../../../providers/I18nProvider'
import { fetchWorkflowStatuses } from '../../../store/ResultWorkflowStatusRedux'
import formatI18nMessage from '../../../utils/i18n/formatterWeb'
import SelectField from '../../shared/SelectField'
import messages from './i18n/generalMessages'

export class ResultWorkflowStatusSelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    fetchWorkflowStatuses: PropTypes.func.isRequired,
    workflowStatusItems: PropTypes.instanceOf(Immutable.List).isRequired,
    onWorkflowStatusChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }

  static defaultProps = {
    allItemText: 'All',
    value: '',
  }

  static contextType = I18nContext

  componentDidMount() {
    this.props.fetchWorkflowStatuses(false)
  }

  handleChange = ({ target: { value } }) => {
    this.props.onWorkflowStatusChange(value === 'all' ? undefined : value)
  }

  render() {
    const { allItemText, workflowStatusItems, value } = this.props
    const restProps = omit(this.props, [
      'allItemText',
      'fetchWorkflowStatuses',
      'workflowStatusItems',
      'onWorkflowStatusChange',
      'value',
    ])
    const { formatMessage } = this.context
    return (
      <SelectField {...restProps} value={value} onChange={this.handleChange}>
        {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
        {workflowStatusItems.map(a => (
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

export default flowRight(connect(mapStateToProps, mapDispatchToProps))(ResultWorkflowStatusSelectField)
