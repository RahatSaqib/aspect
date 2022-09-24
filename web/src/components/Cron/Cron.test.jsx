import React from 'react'
import Tab from '@mui/material/Tab'
import sinon from 'sinon'
import { mountWithI18n } from '../../__setup__/common'
import Cron from './Cron'

describe.only('Cron Selector Component', () => {
  describe('Weekly', () => {
    beforeAll(() => {
      const mockedFormatMessage = jest.fn()
      jest.mock('../../hooks/useI18n', () => ({
        useI18n: () => ({
          locale: 'en',
          formatMessage: mockedFormatMessage,
        }),
      }))
    })
    afterAll(() => jest.unmock('../../hooks/useI18n'))
    let weeklyTab
    let component
    let props
    beforeEach(() => {
      props = {
        showResultText: false,
        showResultCron: true,
        onChange: sinon.spy(),
      }
      component = mountWithI18n(<Cron {...props} />)
      weeklyTab = component.find(Tab).at(1)
      expect(weeklyTab.prop('label')).toBe('Weekly')
      weeklyTab.find('button').simulate('click')
    })
    afterEach(() => {
      component.unmount()
    })
    it('Should return default cron expression for daily', () => {
      expect(props.onChange.lastCall.args[0]).toEqual('0 0 00 ? * * *')
    })
    it('Should return default cron expression for Every Tuesday and friday', () => {
      component
        .find('input[type="checkbox"]')
        .at(1)
        .simulate('change', { target: { checked: true, value: 'TUE' } })
      expect(component.find('input[type="checkbox"]').at(1).prop('checked')).toBe(true)
      expect(props.onChange.lastCall.args[0]).toEqual('0 0 00 ? * TUE *')
    })
  })
  describe('Monthly', () => {
    beforeAll(() => {
      const mockedFormatMessage = jest.fn()
      jest.mock('../../hooks/useI18n', () => ({
        useI18n: () => ({
          locale: 'en',
          formatMessage: mockedFormatMessage,
        }),
      }))
    })
    afterAll(() => jest.unmock('../../hooks/useI18n'))
    let weeklyTab
    let component
    let props
    beforeEach(() => {
      props = {
        showResultText: false,
        showResultCron: true,
        onChange: sinon.spy(),
      }
      component = mountWithI18n(<Cron {...props} />)
      weeklyTab = component.find(Tab).at(2)
      expect(weeklyTab.prop('label')).toBe('Monthly')
      weeklyTab.find('button').simulate('click')
    })
    afterEach(() => {
      component.unmount()
    })
    it('Should return default cron expression for monthly', () => {
      expect(props.onChange.lastCall.args[0]).toEqual('0 0 00 1 1/1 ? *')
    })
    it('Should return default cron expression for On the last weekday of every month', () => {
      component.find('input[type="radio"]').at(2).simulate('change')

      expect(component.find('input[type="radio"]').at(2).prop('checked')).toBe(true)

      expect(props.onChange.lastCall.args[0]).toEqual('0 0 00 LW * ? *')
    })
    it('Should return default cron expression for Last day of every month', () => {
      component.find('input[type="radio"]').at(1).simulate('change')

      expect(component.find('input[type="radio"]').at(1).prop('checked')).toBe(true)

      expect(props.onChange.lastCall.args[0]).toEqual('0 0 00 L * ? *')
    })
    it('Should return default cron expression for Days before the end of the month', () => {
      component.find('input[type="radio"]').at(3).simulate('change')

      expect(component.find('input[type="radio"]').at(3).prop('checked')).toBe(true)

      expect(props.onChange.lastCall.args[0]).toEqual('0 0 00 L-1 * ? *')
    })
  })
})
