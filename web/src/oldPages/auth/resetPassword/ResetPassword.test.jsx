/* eslint-disable security/detect-non-literal-fs-filename */
import React from 'react'
import { LinearProgress, Stepper } from '@mui/material'
import { shallow } from 'enzyme'
import noop from 'lodash/noop'
import { Hidden } from '../../../oldComponents/pureGrids'
import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import ResetPasswordEnterEmail from './ResetPasswordEnterEmail'

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

    it('should contain a vertical stepper for small screens and a horizontal stepper for large screens', () => {
      const largeScreenDiv = ResetPasswordWrapper.find(Hidden).find({
        xs: true,
        sm: true,
      })

      expect(largeScreenDiv.find(Stepper).dive().props().value.orientation).toEqual('horizontal')
    })

    describe('when busy fetching', () => {
      beforeEach(() => {
        ResetPasswordWrapper = ResetPasswordWrapper.setState({
          resettingPassword: true,
        })
      })

      it('should show a progress bar', () => {
        const largeScreenDiv = ResetPasswordWrapper.find(Hidden).find({
          xs: true,
        })

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
        const adminHelpDialog = ResetPasswordWrapper.find(AspectDialog)

        expect(adminHelpDialog.props().title).toEqual('Request a New Password From Aspect')
        expect(adminHelpDialog.props().open).toBe(false)
        expect(adminHelpDialog.children().props().id).toEqual('pages.ResetPassword.adminHelpContent')
        expect({}.hasOwnProperty.call(adminHelpDialog.children().props().values, 'supportEmail')).toBe(true)
      })

      it('should show a dialog when user requests help', () => {
        const resetPasswordEnterEmail = ResetPasswordWrapper.find(ResetPasswordEnterEmail).first()
        resetPasswordEnterEmail.props().onShowAdminHelpDialog({ preventDefault: noop })
        ResetPasswordWrapper.update()

        const adminHelpDialog = ResetPasswordWrapper.find(AspectDialog)
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

        iDidntReceiveAnEmailLink.simulate('click', { preventDefault: noop })
        ResetPasswordWrapper.update()
        let adminHelpDialog = ResetPasswordWrapper.find(AspectDialog)
        expect(adminHelpDialog.props().open).toBe(true)

        adminHelpDialog.props().actions[0].props.onClick()
        ResetPasswordWrapper.update()
        adminHelpDialog = ResetPasswordWrapper.find(AspectDialog)
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

        iDidntReceiveAnEmailLink.simulate('click', { preventDefault: noop })
        ResetPasswordWrapper.update()
        const adminHelpDialog = ResetPasswordWrapper.find(AspectDialog)
        expect(adminHelpDialog.props().open).toBe(true)

        expect(adminHelpDialog.props().actions[1].props.to).toEqual('/login')
      })
    })
  })
})
