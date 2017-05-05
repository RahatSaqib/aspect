import React from 'react'
import { shallow } from 'enzyme'
import Helmet from 'react-helmet'
import LinearProgress from 'material-ui/LinearProgress'
import Paper from 'material-ui/Paper'
import { Tabs, Tab } from 'material-ui/Tabs'

import { Visible } from '../../components/pureGrids'
import ContactDetailsForm from '../../person/detail/ContactDetailsForm'
import LoginDetailsForm from '../../person/detail/LoginDetailsForm'
import UserPreferencesForm from '../../person/detail/UserPreferencesForm'
import { AccountDetailsData } from '../AccountRedux'

describe('AccountDetails module', () => {
  const {
    AccountDetails
  } = require('./AccountDetails')

  describe('AccountDetails component', () => {
    let props
    let AccountDetailsWrapper

    const shallowRenderAccountDetails = () => {
      AccountDetailsWrapper = shallow(<AccountDetails {...props} />)
    }

    beforeEach(() => {
      props = {
        showAcknowledgement: () => {},
        fetchAccountDetails: () => {},
        loading: false,
        saving: false,
        accountDetails: new AccountDetailsData(),
        saveContactDetails: () => {},
        saveLoginDetails: () => {},
        saveUserPreferences: () => {},
        intl: {
          formatMessage: message => message.defaultMessage
        }
      }
      shallowRenderAccountDetails()
    })

    it('Should be a div', () => {
      expect(AccountDetailsWrapper.node.type).toEqual('div')
    })

    describe('When loading is true', () => {
      beforeEach(() => {
        props.loading = true
        shallowRenderAccountDetails()
      })

      it('Should show a progress bar in each tab', () => {
        const firstTab = AccountDetailsWrapper.find(Tab).first()
        expect(firstTab.find(LinearProgress).length).toEqual(1)
        const secondTab = AccountDetailsWrapper.find(Tab).at(1)
        expect(secondTab.find(LinearProgress).length).toEqual(1)
        const thirdTab = AccountDetailsWrapper.find(Tab).at(2)
        expect(thirdTab.find(LinearProgress).length).toEqual(1)
      })
    })

    describe('When loading is false', () => {
      it('Should not show a loading message and a progress bar', () => {
        expect(
          AccountDetailsWrapper.findWhere(element => element.type() === 'span' && element.text() === 'Loading...').length
        ).toEqual(0)
        expect(AccountDetailsWrapper.find(LinearProgress).length).toEqual(0)
      })

      it('Should show a paper container with three tabs', () => {
        expect(AccountDetailsWrapper.node.props.children.length).toEqual(3)
        expect(AccountDetailsWrapper.node.props.children[0].type).toEqual(Helmet)
        expect(AccountDetailsWrapper.node.props.children[2].type).toEqual(Paper)
        const paperContainer = AccountDetailsWrapper.find(Paper)
        expect(paperContainer.length).toEqual(1)
        const tabsContainer = paperContainer.find(Tabs)
        expect(tabsContainer.children().length).toEqual(3)
      })

      it('Should show a Contact Details tab containing a contact details form', () => {
        const firstTab = AccountDetailsWrapper.find(Tab).first()
        expect(firstTab.props().label.props.children).toEqual('Contact Details')
        expect(firstTab.find(Visible).children().text()).toEqual('Contact Details')

        const contactDetailsForm = firstTab.find(ContactDetailsForm)
        expect(contactDetailsForm.props().initialValues).toEqual(props.accountDetails.get('contactDetails'))
        expect(contactDetailsForm.props().onSubmit).toEqual(props.saveContactDetails)
      })

      it('Should show a Login Details tab', () => {
        const secondTab = AccountDetailsWrapper.find(Tab).at(1)
        expect(secondTab.props().label.props.children).toEqual('Username & Password')
        expect(secondTab.find(Visible).children().text()).toEqual('Username & Password')

        const loginDetailsForm = secondTab.find(LoginDetailsForm)
        expect(loginDetailsForm.props().initialValues).toEqual(props.accountDetails.get('loginDetails'))
        expect(loginDetailsForm.props().onSubmit).toEqual(props.saveLoginDetails)
      })

      it('Should show a User Preferences tab', () => {
        const thirdTab = AccountDetailsWrapper.find(Tab).at(2)
        expect(thirdTab.props().label.props.children).toEqual('Language & Timezone')
        expect(thirdTab.find(Visible).children().text()).toEqual('Language & Timezone')

        const userPreferencesForm = thirdTab.find(UserPreferencesForm)
        expect(userPreferencesForm.props().initialValues).toEqual(props.accountDetails.get('userPreferences'))
        expect(userPreferencesForm.props().onSubmit).toEqual(props.saveUserPreferences)
      })
    })
  })
})
