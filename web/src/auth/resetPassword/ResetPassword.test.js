import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import proxyquire from 'proxyquire'
import LinearProgress from 'material-ui/LinearProgress'
import Dialog from 'material-ui/Dialog'
import {
  Stepper,
  StepLabel,
  StepContent
} from 'material-ui/Stepper'
import ResetPasswordEnterEmail from './ResetPasswordEnterEmail'

describe('ResetPassword Component', () => {
  describe('ResetPassword', () => {
    const fakeIntl = {
        injectIntl: component => component
      }, fakeReactRedux = {
        connect: () => component => component
      }, fakeRedux = {
        bindActionCreators: (actionCreators) => actionCreators
      }, ResetPassword = proxyquire('./ResetPassword', {
        'react-intl': fakeIntl,
        'react-redux': fakeReactRedux,
        'redux': fakeRedux
      }).default

    let props, ResetPasswordWrapper

    const shallowRenderResetPassword = () => {
      ResetPasswordWrapper = shallow(<ResetPassword {...props} />)
    }

    beforeEach(() => {
      props = {
        resetPasswordEnterEmailAddress: () => {},
        resetPasswordEnterPassword: () => {},
        addAcknowledgement: () => {},
        addError: () => {},
        intl: {
          formatMessage: message => message.defaultMessage
        }
      }
      shallowRenderResetPassword()
    })

    it('should be a div', () => {
      assert.equal(ResetPasswordWrapper.node.type, 'div')
    })

    it('should contain a vertical stepper for small screens and a horizontal stepper for large screens', () => {
      const largeScreenDiv = ResetPasswordWrapper.find('div.pure-hidden-xs'),
        smallScreenDiv = ResetPasswordWrapper.find('div.pure-hidden-xl')
      assert.equal(largeScreenDiv.find(Stepper).props().orientation, 'horizontal')
      assert.equal(smallScreenDiv.find(Stepper).props().orientation, 'vertical')
    })

    it('should contain the same steps for both large and small screens', () => {
      const smallScreenDiv = ResetPasswordWrapper.find('div.pure-hidden-xl'),
        smallScreenStepper = smallScreenDiv.find(Stepper),
        smallScreenStep1Label = smallScreenStepper.find(StepLabel).at(0),
        smallScreenStep1ResetPasswordEnterEmail = smallScreenStepper.find(StepContent).at(0).children(),
        smallScreenStep2Label = smallScreenStepper.find(StepLabel).at(1),
        smallScreenStep2CheckInbox = smallScreenStepper.find(StepContent).at(1).children(),
        smallScreenStep3Label = smallScreenStepper.find(StepLabel).at(2),
        smallScreenStep3ResetPasswordEnterPassword = smallScreenStepper.find(StepContent).at(2).children(),
        smallScreenStep4Label = smallScreenStepper.find(StepLabel).at(3),
        smallScreenStep4Finish = smallScreenStepper.find(StepContent).at(3).children()

      let largeScreenDiv = ResetPasswordWrapper.find('div.pure-hidden-xs')
      const largeScreenStepper = largeScreenDiv.find(Stepper),
        largeScreenStep1Label = largeScreenStepper.find(StepLabel).at(0),
        largeScreenStep2Label = largeScreenStepper.find(StepLabel).at(1),
        largeScreenStep3Label = largeScreenStepper.find(StepLabel).at(2),
        largeScreenStep4Label = largeScreenStepper.find(StepLabel).at(3),
        largeScreenStep1ResetPasswordEnterEmail = largeScreenDiv.children().at(1)
      ResetPasswordWrapper = ResetPasswordWrapper.setState({
        stepIndex: 1
      })
      largeScreenDiv = ResetPasswordWrapper.find('div.pure-hidden-xs')
      const largeScreenStep2CheckInbox = largeScreenDiv.children().at(1)

      ResetPasswordWrapper = ResetPasswordWrapper.setState({
        stepIndex: 2
      })
      largeScreenDiv = ResetPasswordWrapper.find('div.pure-hidden-xs')
      const largeScreenStep3ResetPasswordEnterPassword = largeScreenDiv.children().at(1).children().first()

      ResetPasswordWrapper = ResetPasswordWrapper.setState({
        stepIndex: 3
      })
      largeScreenDiv = ResetPasswordWrapper.find('div.pure-hidden-xs')
      const largeScreenStep4Finish = largeScreenDiv.children().at(1)

      assert.deepEqual(largeScreenStep1Label.children().text(), smallScreenStep1Label.children().text())
      assert.deepEqual(largeScreenStep2Label.children().text(), smallScreenStep2Label.children().text())
      assert.deepEqual(largeScreenStep3Label.children().text(), smallScreenStep3Label.children().text())
      assert.deepEqual(largeScreenStep4Label.children().text(), smallScreenStep4Label.children().text())

      assert.deepEqual(largeScreenStep1ResetPasswordEnterEmail.props(), smallScreenStep1ResetPasswordEnterEmail.props())
      for(let i = 0; i < largeScreenStep2CheckInbox.children().length; i++) {
        assert.deepEqual(largeScreenStep2CheckInbox.children().at(i).props(), smallScreenStep2CheckInbox.children().at(i).props())
      }
      assert.deepEqual(largeScreenStep3ResetPasswordEnterPassword.props(), smallScreenStep3ResetPasswordEnterPassword.props())
      for(let i = 0; i < largeScreenStep4Finish.children().length; i++) {
        assert.deepEqual(largeScreenStep4Finish.children().at(i).props(), smallScreenStep4Finish.children().at(i).props())
      }
    })

    describe('when busy fetching', () => {
      beforeEach(() => {
        ResetPasswordWrapper = ResetPasswordWrapper.setState({
          resettingPassword: true
        })
      })

      it('should show a progress bar', () => {
        const smallScreenDiv = ResetPasswordWrapper.find('div.pure-hidden-xl'),
          largeScreenDiv = ResetPasswordWrapper.find('div.pure-hidden-xs')

        assert.equal(smallScreenDiv.find(LinearProgress).length, 1)
        assert.equal(largeScreenDiv.find(LinearProgress).length, 1)
      })
    })

    describe('when NOT busy fetching', () => {
      beforeEach(() => {
        ResetPasswordWrapper = ResetPasswordWrapper.setState({
          resettingPassword: false
        })
      })

      it('should show a progress bar', () => {
        const smallScreenDiv = ResetPasswordWrapper.find('div.pure-hidden-xl'),
          largeScreenDiv = ResetPasswordWrapper.find('div.pure-hidden-xs')

        assert.equal(smallScreenDiv.find(LinearProgress).length, 0)
        assert.equal(largeScreenDiv.find(LinearProgress).length, 0)
      })
    })

    describe('admin help dialog', () => {
      it('should contain a hidden admin help dialog', () => {
        const adminHelpDialog = ResetPasswordWrapper.find(Dialog)

        assert.equal(adminHelpDialog.props().title, 'Request a New Password From Aspect')
        assert.isFalse(adminHelpDialog.props().open)
        assert.equal(adminHelpDialog.children().props().id, 'pages.ResetPassword.adminHelpContent')
        assert.isTrue(adminHelpDialog.children().props().values.hasOwnProperty('supportEmail'))
        assert.isTrue(adminHelpDialog.children().props().values.hasOwnProperty('supportTelephone'))

      })

      it('should show a dialog when user requests help', () => {
        const resetPasswordEnterEmail  = ResetPasswordWrapper.find(ResetPasswordEnterEmail).first()
        resetPasswordEnterEmail.props().showAdminHelpDialog()
        ResetPasswordWrapper.update()

        const adminHelpDialog = ResetPasswordWrapper.find(Dialog)
        assert.isTrue(adminHelpDialog.props().open)
      })

      it('should allow the user to close the dialog', () => {
        ResetPasswordWrapper = ResetPasswordWrapper.setState({
          stepIndex: 1
        })
        const step2Content = ResetPasswordWrapper.find('div.pure-hidden-xs').children().at(1),
          iDidntReceiveAnEmailLink = step2Content.children().find('a')
        iDidntReceiveAnEmailLink.simulate('click')
        ResetPasswordWrapper.update()
        let adminHelpDialog = ResetPasswordWrapper.find(Dialog)
        assert.isTrue(adminHelpDialog.props().open)

        adminHelpDialog.props().actions[0].props.onTouchTap()
        ResetPasswordWrapper.update()
        adminHelpDialog = ResetPasswordWrapper.find(Dialog)
        assert.isFalse(adminHelpDialog.props().open)
      })

      it('should allow the user to go back to the login page', () => {
        ResetPasswordWrapper = ResetPasswordWrapper.setState({
          stepIndex: 1
        })
        const step2Content = ResetPasswordWrapper.find('div.pure-hidden-xs').children().at(1),
          iDidntReceiveAnEmailLink = step2Content.children().find('a')
        iDidntReceiveAnEmailLink.simulate('click')
        ResetPasswordWrapper.update()
        let adminHelpDialog = ResetPasswordWrapper.find(Dialog)
        assert.isTrue(adminHelpDialog.props().open)

        assert.equal(adminHelpDialog.props().actions[1].type.displayName, 'Link')
        assert.equal(adminHelpDialog.props().actions[1].props.to, 'login')
      })
    })
  })
})
