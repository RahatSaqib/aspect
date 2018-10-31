import React from 'react'
import _ from 'lodash'
import { compose, withStateHandlers } from 'recompose'
import { themr } from 'react-css-themr'
import { BUTTON, DATE_PICKER, TIME_PICKER } from 'react-toolbox/lib/identifiers'
import calendarFactory from 'react-toolbox/lib/date_picker/Calendar'
import { iconButtonFactory } from 'react-toolbox/lib/button/IconButton'
import rippleFactory from 'react-toolbox/lib/ripple/Ripple'
import datePickerDialogFactory from 'react-toolbox/lib/date_picker/DatePickerDialog'
import timePickerDialogFactory from 'react-toolbox/lib/time_picker/TimePickerDialog'
import InjectFontIcon from 'react-toolbox/lib/font_icon/FontIcon'
import InjectDialog from 'react-toolbox/lib/dialog'
import Input from 'react-toolbox/lib/input'
import dateTheme from 'react-toolbox/lib/date_picker/theme.css'
import timeTheme from 'react-toolbox/lib/time_picker/theme.css'
import buttonTheme from 'react-toolbox/lib/button/theme.css'
import rippletheme from 'react-toolbox/lib/ripple/theme.css'
import { formatDateTime } from '../../shared/utils/dateFormat'

const InjectIconButton = themr(BUTTON, buttonTheme)(
  iconButtonFactory(
    rippleFactory({ centered: true, theme: rippletheme }),
    InjectFontIcon
  )
)
const Calendar = calendarFactory(InjectIconButton)
const DatePickerDialog = themr(DATE_PICKER, dateTheme)(
  datePickerDialogFactory(InjectDialog, Calendar)
)
const TimePickerDialog = themr(TIME_PICKER, timeTheme)(
  timePickerDialogFactory(InjectDialog, Calendar)
)

export const SHOW_MODE = {
  CLOSE: { name: 'CLOSE', next: 'DATE' },
  DATE: { name: 'DATE', next: 'TIME' },
  TIME: { name: 'TIME', next: 'CLOSE' },
}

export const enhance = compose(
  withStateHandlers(
    ({ value }) => ({
      dateTime: value,
      showMode: SHOW_MODE.CLOSE,
    }),
    {
      onSelectDate: ({ dateTime, showMode }) => value => {
        if (_.isDate(value)) {
          value.setSeconds(0)
          value.setMilliseconds(0)
        }
        return {
          showMode: SHOW_MODE[showMode.next],
          dateTime: _.isDate(value) ? value : dateTime,
        }
      },
      onSelectTime: ({ showMode }, { onChange }) => value => {
        if (_.isDate(value) && onChange) {
          value.setSeconds(0)
          value.setMilliseconds(0)
          onChange(value)
        }
        return {
          showMode: SHOW_MODE[showMode.next],
          dateTime: value,
        }
      },
      onCancel: (state, { value }) => () => ({
        dateTime: value,
        showMode: SHOW_MODE.CLOSE,
      }),
    }
  )
)

export const DateTimePicker = ({
  dateTime,
  value,
  theme = {},
  showMode = SHOW_MODE.CLOSE,
  onSelectDate,
  onSelectTime,
  onCancel,
  ...restProps
}) => {
  const showDate = _.isDate(dateTime) ? dateTime : undefined
  const formattedDate = showDate === undefined ? '' : formatDateTime(dateTime)
  return (
    <div>
      <DatePickerDialog
        active={showMode.name === SHOW_MODE.DATE.name}
        onDismiss={onCancel}
        onEscKeyDown={onCancel}
        onOverlayClick={onCancel}
        onSelect={onSelectDate}
        value={showDate}
        autoOk
        sundayFirstDayOfWeek
        {...restProps}
      />
      <TimePickerDialog
        active={showMode.name === SHOW_MODE.TIME.name}
        onDismiss={onCancel}
        onEscKeyDown={onCancel}
        onOverlayClick={onCancel}
        onSelect={onSelectTime}
        value={showDate}
        {...restProps}
      />
      <Input
        value={formattedDate}
        theme={theme.Input}
        onFocus={onSelectDate}
        readOnly
      />
    </div>
  )
}

export default enhance(DateTimePicker)
