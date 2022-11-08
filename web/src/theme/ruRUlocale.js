import getPickersLocalization from './helpers'

const ruRUPickers = {
  // Calendar navigation
  previousMonth: 'Предыдущий месяц',
  nextMonth: 'в следующем месяце',

  // View navigation
  openPreviousView: 'открыть предыдущий вид',
  openNextView: 'открыть следующий вид',
  calendarViewSwitchingButtonAriaLabel: view =>
    view === 'year'
      ? 'просмотр года открыт, переключитесь на просмотр календаря'
      : 'просмотр календаря открыт, переключитесь на просмотр года',
  inputModeToggleButtonAriaLabel: (isKeyboardInputOpen, viewType) =>
    isKeyboardInputOpen
      ? `окно ввода текста открыто, перейдите в представление ${viewType}`
      : `Представление ${viewType} открыто, перейдите к представлению ввода текста`,

  // DateRange placeholders
  start: 'Начало',
  end: 'конец',

  // Action bar
  cancelButtonLabel: 'Отмена',
  clearButtonLabel: 'Чисто',
  okButtonLabel: 'Ацептар',
  todayButtonLabel: 'Сегодня',

  // Toolbar titles
  datePickerToolbarTitle: 'Выберите дату',
  dateTimePickerToolbarTitle: 'Выберите дату и время',
  timePickerToolbarTitle: 'Выберите время',
  dateRangePickerToolbarTitle: 'Выберите диапазон дат',

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

const ruRU = getPickersLocalization(ruRUPickers)
export default ruRU
