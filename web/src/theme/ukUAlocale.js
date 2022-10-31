// This object is not Partial<PickersLocaleText> because it is the default values
import { getPickersLocalization } from './helpers'

const ukUAPickers = {
  // Calendar navigation
  previousMonth: 'Попередній місяць',
  nextMonth: 'в наступному місяці',

  // View navigation
  openPreviousView: 'відкрити попередній вигляд',
  openNextView: 'відкрити наступний вигляд',
  calendarViewSwitchingButtonAriaLabel: view =>
    view === 'year'
      ? 'просмотр года открыт, переключитесь на просмотр календаря'
      : 'просмотр календаря открыт, переключитесь на просмотр года',
  inputModeToggleButtonAriaLabel: (isKeyboardInputOpen, viewType) =>
    isKeyboardInputOpen
      ? `окно ввода текста открыто, перейдите в представление ${viewType}`
      : `Відкриття ${viewType} відкрите, перейдіть до подання введення тексту`,

  // DateRange placeholders
  start: 'початок',
  end: 'кінець',

  // Action bar
  cancelButtonLabel: 'скасування',
  clearButtonLabel: 'Чисто',
  okButtonLabel: 'Ацептар',
  todayButtonLabel: 'Сьогодні',

  // Toolbar titles
  datePickerToolbarTitle: 'Виберіть дату',
  dateTimePickerToolbarTitle: 'Виберіть дату та час',
  timePickerToolbarTitle: 'Виберіть час',
  dateRangePickerToolbarTitle: 'Виберіть діапазон дат',

  // // Open picker labels
  // openDatePickerDialogue: (value, utils) =>
  //   value !== null && utils.isValid(value)
  //     ? `Choose date, selected date is ${utils.format(value, 'fullDate')}`
  //     : 'Choose date',
  // openTimePickerDialogue: (value, utils) =>
  //   value !== null && utils.isValid(value)
  //     ? `Choose time, selected time is ${utils.format(value, 'fullTime')}`
  //     : 'Choose time',

  // Table labels
  timeTableLabel: 'вибрати час',
  dateTableLabel: 'вибрати дату',

  // Field section placeholders
  fieldYearPlaceholder: params => 'Y'.repeat(params.digitAmount),
  fieldMonthPlaceholder: params => (params.contentType === 'letter' ? 'MMMM' : 'MM'),
  fieldDayPlaceholder: () => 'DD',
  fieldHoursPlaceholder: () => 'hh',
  fieldMinutesPlaceholder: () => 'mm',
  fieldSecondsPlaceholder: () => 'ss',
  fieldMeridiemPlaceholder: () => 'aa',
}

const ukUA = getPickersLocalization(ukUAPickers)
export default ukUA
