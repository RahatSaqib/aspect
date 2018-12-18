import _ from 'lodash'
import React from 'react'
import { shallow } from 'enzyme'
import LinearProgress from '@material-ui/core/LinearProgress'
import Stepper from '@material-ui/core/Stepper'
import StepLabel from '@material-ui/core/StepLabel'
import StepContent from '@material-ui/core/StepContent'

import { Hidden } from '../../components/pureGrids'
import ResetPasswordEnterEmail from './ResetPasswordEnterEmail'
import Dialog from '../../components/shared/Dialog'

describe('ResetPassword module', () => {
  const { ResetPassword } = require('./ResetPassword')

  describe('ResetPassword Component', () => {
    let props
    let ResetPasswordWrapper

    const shallowRenderResetPassword = () => {
      ResetPasswordWrapper = shallow(<ResetPassword {...props} />)
    }

    beforeEach(() => {
      props = {
        resetPasswordEnterEmailAddress: () => {},
        resetPasswordEnterPassword: () => {},
        showAcknowledgement: () => {},
        showError: () => {},
        intl: {
          formatMessage: message => message.defaultMessage,
        },
        searchParams: new URLSearchParams(),
      }
      shallowRenderResetPassword()
    })

    it('should be a div', () => {
      expect(ResetPasswordWrapper.getElement().type).toEqual('div')
    })

    it.only('should contain a vertical stepper for small screens and a horizontal stepper for large screens', () => {
      const largeScreenDiv = ResetPasswordWrapper.find(Hidden).find({
        xs: true,
        sm: true,
      })
      const smallScreenDiv = ResetPasswordWrapper.find(Hidden).find({
        xl: true,
      })

      expect(
        largeScreenDiv
          .find(Stepper)
          .dive()
          .props().orientation
      ).toEqual('horizontal')
      expect(
        smallScreenDiv
          .find(Stepper)
          .dive()
          .props().orientation
      ).toEqual('vertical')
    })

    it('should contain the same steps for both large and small screens', () => {
      const smallScreenDiv = ResetPasswordWrapper.find(Hidden).find({
        xl: true,
      })
      const smallScreenStepper = smallScreenDiv.find(Stepper)
      const smallScreenStep1Label = smallScreenStepper.find(StepLabel).at(0)
      const smallScreenStep1ResetPasswordEnterEmail = smallScreenStepper
        .find(StepContent)
        .at(0)
        .children()
      const smallScreenStep2Label = smallScreenStepper.find(StepLabel).at(1)
      const smallScreenStep3Label = smallScreenStepper.find(StepLabel).at(2)
      const smallScreenStep3ResetPasswordEnterPassword = smallScreenStepper
        .find(StepContent)
        .at(2)
        .children()
      const smallScreenStep4Label = smallScreenStepper.find(StepLabel).at(3)
      const smallScreenStep4Finish = smallScreenStepper
        .find(StepContent)
        .at(3)
        .children()

      let largeScreenDiv = ResetPasswordWrapper.find(Hidden).find({
        xs: true,
        sm: true,
      })
      const largeScreenStepper = largeScreenDiv.find(Stepper)
      const largeScreenStep1Label = largeScreenStepper.find(StepLabel).at(0)
      const largeScreenStep2Label = largeScreenStepper.find(StepLabel).at(1)
      const largeScreenStep3Label = largeScreenStepper.find(StepLabel).at(2)
      const largeScreenStep4Label = largeScreenStepper.find(StepLabel).at(3)
      const largeScreenStep1ResetPasswordEnterEmail = largeScreenDiv
        .children()
        .at(1)

      ResetPasswordWrapper = ResetPasswordWrapper.setState({
        stepIndex: 1,
      })
      largeScreenDiv = ResetPasswordWrapper.find(Hidden).find({
        xs: true,
        sm: true,
      })

      ResetPasswordWrapper = ResetPasswordWrapper.setState({
        stepIndex: 2,
      })
      largeScreenDiv = ResetPasswordWrapper.find(Hidden).find({ xs: true })
      const largeScreenStep3ResetPasswordEnterPassword = largeScreenDiv
        .children()
        .at(1)
        .children()
        .first()

      ResetPasswordWrapper = ResetPasswordWrapper.setState({
        stepIndex: 3,
      })
      largeScreenDiv = ResetPasswordWrapper.find(Hidden).find({
        xs: true,
        sm: true,
      })
      const largeScreenStep4Finish = largeScreenDiv.children().at(1)

      expect(largeScreenStep1Label.children().text()).toEqual(
        smallScreenStep1Label.children().text()
      )
      expect(largeScreenStep2Label.children().text()).toEqual(
        smallScreenStep2Label.children().text()
      )
      expect(largeScreenStep3Label.children().text()).toEqual(
        smallScreenStep3Label.children().text()
      )
      expect(largeScreenStep4Label.children().text()).toEqual(
        smallScreenStep4Label.children().text()
      )

      expect(largeScreenStep1ResetPasswordEnterEmail.props()).toEqual(
        smallScreenStep1ResetPasswordEnterEmail.props()
      )
      expect(largeScreenStep3ResetPasswordEnterPassword.props()).toEqual(
        smallScreenStep3ResetPasswordEnterPassword.props()
      )
      for (let i = 0; i < largeScreenStep4Finish.children().length; i++) {
        expect(
          largeScreenStep4Finish
            .children()
            .at(i)
            .props()
        ).toEqual(
          smallScreenStep4Finish
            .children()
            .at(i)
            .props()
        )
      }
    })

    describe('when busy fetching', () => {
      beforeEach(() => {
        ResetPasswordWrapper = ResetPasswordWrapper.setState({
          resettingPassword: true,
        })
      })

      it('should show a progress bar', () => {
        const smallScreenDiv = ResetPasswordWrapper.find(Hidden).find({
          xl: true,
        })
        const largeScreenDiv = ResetPasswordWrapper.find(Hidden).find({
          xs: true,
        })

        expect(smallScreenDiv.find(LinearProgress).length).toEqual(1)
        expect(largeScreenDiv.find(LinearProgress).length).toEqual(1)
      })
    })

    describe('when NOT busy fetching', () => {
      beforeEach(() => {
        ResetPasswordWrapper = ResetPasswordWrapper.setState({
          resettingPassword: false,
        })
      })

      it('should show a progress bar', () => {
        const smallScreenDiv = ResetPasswordWrapper.find(Hidden).find({
          xl: true,
        })
        const largeScreenDiv = ResetPasswordWrapper.find(Hidden).find({
          xs: true,
        })

        expect(smallScreenDiv.find(LinearProgress).length).toEqual(0)
        expect(largeScreenDiv.find(LinearProgress).length).toEqual(0)
      })
    })

    describe('admin help dialog', () => {
      it('should contain a hidden admin help dialog', () => {
        const adminHelpDialog = ResetPasswordWrapper.find(Dialog)

        expect(adminHelpDialog.props().title).toEqual(
          'Request a New Password From Aspect'
        )
        expect(adminHelpDialog.props().open).toBe(false)
        expect(adminHelpDialog.children().props().id).toEqual(
          'pages.ResetPassword.adminHelpContent'
        )
        expect(
          {}.hasOwnProperty.call(
            adminHelpDialog.children().props().values,
            'supportEmail'
          )
        ).toBe(true)
      })

      it('should show a dialog when user requests help', () => {
        const resetPasswordEnterEmail = ResetPasswordWrapper.find(
          ResetPasswordEnterEmail
        ).first()
        resetPasswordEnterEmail
          .props()
          .onShowAdminHelpDialog({ preventDefault: _.noop })
        ResetPasswordWrapper.update()

        const adminHelpDialog = ResetPasswordWrapper.find(Dialog)
        expect(adminHelpDialog.props().open).toBe(true)
      })

      it('should allow the user to close the dialog', () => {
        ResetPasswordWrapper = ResetPasswordWrapper.setState({
          stepIndex: 1,
        })
        const largeScreenDiv = ResetPasswordWrapper.find(Hidden).find({
          xs: true,
        })
        const step2Content = largeScreenDiv.children().at(1)
        const iDidntReceiveAnEmailLink = step2Content.children().find('a')

        iDidntReceiveAnEmailLink.simulate('click', { preventDefault: _.noop })
        ResetPasswordWrapper.update()
        let adminHelpDialog = ResetPasswordWrapper.find(Dialog)
        expect(adminHelpDialog.props().open).toBe(true)

        adminHelpDialog.props().actions[0].props.onClick()
        ResetPasswordWrapper.update()
        adminHelpDialog = ResetPasswordWrapper.find(Dialog)
        expect(adminHelpDialog.props().open).toBe(false)
      })

      it('should allow the user to go back to the login page', () => {
        ResetPasswordWrapper = ResetPasswordWrapper.setState({
          stepIndex: 1,
        })
        const largeScreenDiv = ResetPasswordWrapper.find(Hidden).find({
          xs: true,
        })
        const step2Content = largeScreenDiv.children().at(1)
        const iDidntReceiveAnEmailLink = step2Content.children().find('a')

        iDidntReceiveAnEmailLink.simulate('click', { preventDefault: _.noop })
        ResetPasswordWrapper.update()
        const adminHelpDialog = ResetPasswordWrapper.find(Dialog)
        expect(adminHelpDialog.props().open).toBe(true)

        expect(adminHelpDialog.props().actions[1].props.to).toEqual('login')
      })
    })
  })
})
