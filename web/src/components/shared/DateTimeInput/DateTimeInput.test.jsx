import React from 'react'
import { createTheme, ThemeProvider } from '@mui/material'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import isDateEqual from 'date-fns/isEqual'
import { vi } from 'vitest'
import I18nProvider from '../../../providers/I18nProvider'
import DateTimeInput from './DateTimeInput'

const theme = createTheme()

const DateTimeInputI18n = props => (
  <ThemeProvider theme={theme}>
    <I18nProvider>
      <DateTimeInput {...props} />
    </I18nProvider>
  </ThemeProvider>
)

describe('DateTimeInput component', () => {
  const commonProps = {
    dateFormat: 'yyyy/MM/dd',
    timeFormat: 'HH:mm:ss',
    minDate: '2000-02-25 18:19:02',
    maxDate: '2010-05-18 16:30:00',
  }

  const selectRootSelector = 'div[role="presentation"]'

  const getFieldOrder = container =>
    Array.from(container.querySelectorAll(selectRootSelector)).map(node => node.getAttribute('name'))

  // the dropdown is only mounted while the field has focus, and its options are filtered by the typed value
  const selectOption = async (user, container, fieldName, optionLabel) => {
    const input = container.querySelector(`input[name="${fieldName}"]`)
    await user.click(input)
    await user.clear(input)
    await user.type(input, optionLabel)
    const menu = await screen.findByRole('menu')
    await user.click(within(menu).getByText(optionLabel))
  }

  describe('common', () => {
    it('should determine the order of dropdowns by `dateFormat` and `timeFormat` props', () => {
      const { container, rerender } = render(<DateTimeInputI18n {...commonProps} />)
      expect(getFieldOrder(container)).toEqual(['Year', 'Month', 'Date', 'Hours', 'Minutes'])

      rerender(<DateTimeInputI18n {...commonProps} dateFormat="d/M/y" timeFormat="s:m:H" />)
      expect(getFieldOrder(container)).toEqual(['Date', 'Month', 'Year', 'Minutes', 'Hours'])
    })
  })

  describe('controlled mode', () => {
    let props
    const getMockOnChange = date => vi.fn(d => isDateEqual(date, d))

    beforeEach(() => {
      props = {
        ...commonProps,
        value: new Date(2005, 2, 18),
      }
    })

    afterEach(() => {
      props = null
    })

    it('should render without crash', () => {
      const { container } = render(<DateTimeInputI18n {...props} />)

      expect(container.querySelectorAll(selectRootSelector)).toHaveLength(5)
    })

    it('should invoke `onChange` when a option has been selected', async () => {
      const user = userEvent.setup()
      const onChange = getMockOnChange(new Date(2006, 2, 18))
      const { container } = render(<DateTimeInputI18n {...props} onChange={onChange} />)

      await selectOption(user, container, 'Year', '2006')

      expect(onChange).toHaveReturnedWith(true)
    })

    it('should invoke `onChange` when a month has been selected', async () => {
      const user = userEvent.setup()
      const onChange = getMockOnChange(new Date(2005, 3, 18))
      const { container } = render(<DateTimeInputI18n {...props} onChange={onChange} />)

      await selectOption(user, container, 'Month', '04')

      expect(onChange).toHaveReturnedWith(true)
    })
  })

  describe('uncontrolled mode', () => {
    let props
    beforeEach(() => {
      props = {
        ...commonProps,
        defaultValue: new Date(2005, 2, 18),
      }
    })

    afterEach(() => {
      props = null
    })

    it('should render without crash', () => {
      const { container } = render(<DateTimeInputI18n {...props} />)

      expect(container.querySelectorAll(selectRootSelector)).toHaveLength(5)
    })
  })
})
