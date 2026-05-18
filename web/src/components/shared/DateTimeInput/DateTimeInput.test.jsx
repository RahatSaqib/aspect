import React from 'react'
import isDateEqual from 'date-fns/isEqual'
import Downshift from 'downshift'
import { act } from 'react-dom/test-utils'
import { mountWithTheme, shallowWithTheme } from '../../../__setup__/common'
import I18nProvider from '../../../providers/I18nProvider'
import DateTimeInput from './DateTimeInput'

const DateTimeInputI18n = props => (
  <I18nProvider>
    <DateTimeInput {...props} />
  </I18nProvider>
)

describe('DateTimeInput component', () => {
  const commonProps = {
    dateFormat: 'yyyy/MM/dd',
    timeFormat: 'HH:mm:ss',
    minDate: '2000-02-25 18:19:02',
    maxDate: '2010-05-18 16:30:00',
  }

  const selectRootSelector = 'div[role="presentation"]'

  describe('common', () => {
    it('should determine the order of dropdowns by `dateFormat` and `timeFormat` props', () => {
      const wrapper = mountWithTheme(<DateTimeInputI18n {...commonProps} />)
      expect(wrapper.find(selectRootSelector).map(node => node.prop('name'))).toEqual([
        'Year',
        'Month',
        'Date',
        'Hours',
        'Minutes',
      ])

      wrapper.setProps({
        children: <DateTimeInputI18n {...commonProps} dateFormat="d/M/y" timeFormat="s:m:H" />,
      })
      expect(wrapper.find(selectRootSelector).map(node => node.prop('name'))).toEqual([
        'Date',
        'Month',
        'Year',
        'Minutes',
        'Hours',
      ])
    })
  })

  describe('controlled mode', () => {
    let props
    const getMockOnChange = date => jest.fn(d => isDateEqual(date, d))

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
      shallowWithTheme(<DateTimeInputI18n {...props} />)
    })

    it('should invoke `onChange` when a option has been selected', () => {
      let onChange = getMockOnChange(new Date(2006, 2, 18))
      const wrapper = mountWithTheme(<DateTimeInputI18n {...props} />)
      wrapper.setProps({
        children: <DateTimeInputI18n {...props} onChange={onChange} />,
      })

      act(() => {
        const yearSelect = wrapper.find(Downshift).filterWhere(node => node.children().prop('name') === 'Year')

        yearSelect.prop('onSelect')({
          value: 2006,
          label: '2006',
        })
      })
      expect(onChange).toHaveReturnedWith(true)

      onChange = getMockOnChange(new Date(2006, 3, 18))
      wrapper.setProps({
        children: <DateTimeInputI18n {...props} onChange={onChange} />,
      })

      act(() => {
        const monthSelect = wrapper.find(Downshift).filterWhere(node => node.children().prop('name') === 'Month')
        monthSelect.prop('onSelect')({
          value: 3,
          label: 'Apr',
        })
      })

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
      shallowWithTheme(<DateTimeInputI18n {...props} />)
    })
  })
})
