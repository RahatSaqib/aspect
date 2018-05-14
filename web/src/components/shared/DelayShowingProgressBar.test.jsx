import React from 'react'
import ReactTestRenderer from 'react-test-renderer'

jest.useFakeTimers()

describe('DelayShowingProgressBar module', () => {
  const {
    default: DelayShowingProgressBar,
  } = require('./DelayShowingProgressBar')

  describe('DelayShowingProgressBar component', () => {
    it('should render correctly', () => {
      const component = ReactTestRenderer.create(
        <DelayShowingProgressBar disabled />
      )
      expect(component).toMatchSnapshot()
    })

    describe('when render once', () => {
      it('should disable progress bar give by initial condition', () => {
        const component = ReactTestRenderer.create(
          <DelayShowingProgressBar disabled />
        )
        expect(component).toMatchSnapshot()

        jest.runTimersToTime(1000)
        expect(component).toMatchSnapshot()
      })

      it('should enable progress bar give by initial condition', () => {
        const component = ReactTestRenderer.create(
          <DelayShowingProgressBar disabled={false} />
        )
        expect(component).toMatchSnapshot()

        jest.runTimersToTime(1000)
        expect(component).toMatchSnapshot()
      })
    })

    describe('when change from disabled to enabled', () => {
      it('should enable progress bar with a delay', () => {
        const component = ReactTestRenderer.create(
          <DelayShowingProgressBar disabled />
        )
        expect(component).toMatchSnapshot()

        component.update(<DelayShowingProgressBar disabled={false} />)
        expect(component).toMatchSnapshot()

        jest.runTimersToTime(300)
        const json = component.toJSON()
        expect(json).toMatchSnapshot()

        jest.runTimersToTime(1000)
        expect(component).toMatchSnapshot()
        expect(component.toJSON()).not.toEqual(json)
      })
    })

    describe('when change from enabled to disabled', () => {
      it('should disable progress bar immediately', () => {
        const component = ReactTestRenderer.create(
          <DelayShowingProgressBar disabled={false} />
        )
        expect(component).toMatchSnapshot()

        component.update(<DelayShowingProgressBar disabled />)
        const json = component.toJSON()
        expect(json).toMatchSnapshot()

        jest.runTimersToTime(1000)
        expect(component).toMatchSnapshot()
        expect(component.toJSON()).toEqual(json)
      })
    })
  })
})
