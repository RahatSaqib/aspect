// Imports from packages
import endOfDay from 'date-fns/end_of_day'
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

  getMinDate() {
    const { minDate } = this.props
    return minDate && new Date(minDate)
  }

  getMaxDate() {
    const { maxDate } = this.props
    return maxDate && new Date(maxDate)
  }

  handleMaxDateChange = (_, date) => {
    this.props.onChangeDate({ maxDate: endOfDay(date).toJSON() })
  }

  handleClear = () => {
    this.props.onChangeDate({ minDate: null, maxDate: null })
  }

  handleMinDateChange = (_, date) => {
    this.props.onChangeDate({ minDate: date.toJSON() })
  }

  render() {
    const { clearButtonTooltip, clearButtonStyle, minDate, maxDate } = this.props
    const restProps = _.omit(this.props, [
      'clearButtonTooltip', 'clearButtonStyle', 'onChangeDate', 'minDate', 'maxDate'
    ])

    return (
      <div style={{ display: 'inline-block' }}>
        <DatePicker
          {...restProps}
          value={this.getMinDate()}
          onChange={this.handleMinDateChange}
          hintText="Start from"
          container="inline"
          mode="landscape"
          style={{ display: 'inline-block' }}
        />
        <DatePicker
          {...restProps}
          value={this.getMaxDate()}
          onChange={this.handleMaxDateChange}
          hintText="End at"
          container="inline"
          mode="landscape"
          style={{ display: 'inline-block' }}
        />
        {(minDate || maxDate) && (
          <IconButton
            tooltip={clearButtonTooltip}
            style={clearButtonStyle}
            onTouchTap={this.handleClear}
          >
            <ContentClear />
          </IconButton>
        )}
      </div>
    )
  }
}

export default DateRangeSelector
