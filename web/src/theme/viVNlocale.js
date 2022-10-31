// This object is not Partial<PickersLocaleText> because it is the default values
import { getPickersLocalization } from './helpers'

const viVNPickers = {
  // Calendar navigation
  previousMonth: 'tháng trước',
  nextMonth: 'tháng tiếp theo',

  // View navigation
  openPreviousView: 'mở chế độ xem trước đó',
  openNextView: 'mở chế độ xem tiếp theo',
  calendarViewSwitchingButtonAriaLabel: view =>
    view === 'year'
      ? 'chế độ xem năm đang mở, hãy chuyển sang chế độ xem lịch'
      : 'chế độ xem lịch đang mở, chuyển sang chế độ xem năm',
  inputModeToggleButtonAriaLabel: (isKeyboardInputOpen, viewType) =>
    isKeyboardInputOpen
      ? `cửa sổ nhập văn bản đang mở, hãy chuyển sang chế độ xem ${viewType}`
      : `Đang mở $ {viewType}, hãy chuyển sang chế độ xem đầu vào`,

  // Trình giữ chỗ DateRange
  start: 'bắt đầu',
  end: 'end',

  // Thanh tác vụ
  cancelButtonLabel: 'hủy bỏ',
  clearButtonLabel: 'Xóa',
  okButtonLabel: 'Người chấp nhận',
  todayButtonLabel: 'Hôm nay',

  // Tiêu đề thanh công cụ
  datePickerToolbarTitle: 'Chọn một ngày',
  dateTimePickerToolbarTitle: 'Chọn ngày và giờ',
  timePickerToolbarTitle: 'Chọn thời gian',
  dateRangePickerToolbarTitle: 'Chọn phạm vi ngày',

  // // Mở nhãn bộ chọn
  // openDatePickerDialogue: (value, utils) =>
  // giá trị! == null && utils.isValid (giá trị)
  // ? `Chọn ngày, ngày đã chọn là $ {utils.format (value, 'fullDate')} '
  // : 'Chọn ngày',
  // openTimePickerDialogue: (value, utils) =>
  // giá trị! == null && utils.isValid (giá trị)
  // ? `Chọn thời gian, thời gian đã chọn là $ {utils.format (value, 'fullTime')} '
  // : 'Chọn thời gian',

  // Nhãn bảng
  timeTableLabel: 'chọn thời gian',
  dateTableLabel: 'chọn ngày',

  // Field section placeholders
  fieldYearPlaceholder: params => 'Y'.repeat(params.digitAmount),
  fieldMonthPlaceholder: params => (params.contentType === 'letter' ? 'MMMM' : 'MM'),
  fieldDayPlaceholder: () => 'DD',
  fieldHoursPlaceholder: () => 'hh',
  fieldMinutesPlaceholder: () => 'mm',
  fieldSecondsPlaceholder: () => 'ss',
  fieldMeridiemPlaceholder: () => 'aa',
}

const viVN = getPickersLocalization(viVNPickers)
export default viVN
