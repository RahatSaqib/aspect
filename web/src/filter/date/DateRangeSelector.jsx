// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'

// Material-UI
import DatePicker from 'material-ui/DatePicker'
import IconButton from 'material-ui/IconButton'
import ContentClear from 'material-ui/svg-icons/content/clear'

export class DateRangeSelector extends PureComponent {

  static propTypes = {
    clearButtonTooltip: PropTypes.string.isRequired,
    clearButtonStyle: PropTypes.object,
    onChangeDate: PropTypes.func.isRequired,
    minDate: PropTypes.string,
    maxDate: PropTypes.string
  }

  handleMinDateChange = (_, date) => {
    this.props.onChangeDate('minDate', date.toJSON())
  }

  handleClearMinDate = () => {
    this.props.onChangeDate('minDate', null)
  }

  handleMaxDateChange = (_, date) => {
    this.props.onChangeDate('maxDate', date.toJSON())
  }

  handleClearMaxDate = () => {
    this.props.onChangeDate('maxDate', null)
  }

  getMinDate() {
    const { minDate } = this.props
    return minDate && new Date(minDate)
  }

  getMaxDate() {
    const { maxDate } = this.props
    return maxDate && new Date(maxDate)
  }

  render() {
    const { clearButtonTooltip, clearButtonStyle, minDate, maxDate } = this.props
    const restProps = _.omit(this.props, [
      'clearButtonTooltip', 'clearButtonStyle', 'onChangeDate', 'minDate', 'maxDate'
    ])

    return (
      <div style={{display: 'inline-block'}}>
        <DatePicker
          {...restProps}
          value={this.getMinDate()}
          onChange={this.handleMinDateChange}
          hintText="Start from"
          container="inline"
          mode="landscape"
          style={{display: 'inline-block'}}
        />
        {minDate && (
          <IconButton
            tooltip={clearButtonTooltip}
            style={clearButtonStyle}
            onTouchTap={this.handleClearMinDate}
          >
            <ContentClear />
          </IconButton>
        )}
        <DatePicker
          {...restProps}
          value={this.getMaxDate()}
          onChange={this.handleMaxDateChange}
          hintText="End at"
          container="inline"
          mode="landscape"
          style={{display: 'inline-block'}}
        />
        {maxDate && (
          <IconButton
            tooltip={clearButtonTooltip}
            style={clearButtonStyle}
            onTouchTap={this.handleClearMaxDate}
          >
            <ContentClear />
          </IconButton>
        )}
      </div>
    )
  }
}

export default DateRangeSelector
