import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import Immutable from 'immutable'
import LinearProgress from 'material-ui/LinearProgress'
import Paper from 'material-ui/Paper'
import {
  Step,
  Stepper,
  StepLabel,
  StepContent
} from 'material-ui/Stepper'
import ResetPasswordEnterEmail from './ResetPasswordEnterEmail'
import ResetPasswordEnterPassword from './ResetPasswordEnterPassword'

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
  })
})
