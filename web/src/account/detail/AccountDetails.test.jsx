import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import Immutable from 'immutable'
import LinearProgress from 'material-ui/LinearProgress'
import Paper from 'material-ui/Paper'
import Helmet from 'react-helmet'
import { Tabs, Tab } from 'material-ui/Tabs'

import { Visible } from '../../components/pureGrids'
import ContactDetailsForm from '../../person/detail/ContactDetailsForm'
import LoginDetailsForm from '../../person/detail/LoginDetailsForm'
import UserPreferencesForm from '../../person/detail/UserPreferencesForm'
import { AccountDetails } from '../AccountRedux'

describe('AccountDetails Component', () => {
  describe('AccountDetails', () => {
    const fakeIntl = {
      injectIntl: component => component
    }
    const fakeReactRedux = {
      connect: () => component => component
    }
    const fakeRedux = {
      bindActionCreators: actionCreators => actionCreators
    }
    const AccountDetailsComponent = proxyquire('./AccountDetails', {
      'react-intl': fakeIntl,
      'react-redux': fakeReactRedux,
      redux: fakeRedux
    }).AccountDetailsContainer

    let props
    let AccountDetailsWrapper

    const shallowRenderAccountDetails = () => {
      AccountDetailsWrapper = shallow(<AccountDetailsComponent {...props} />)
    }

    const AccountDetailsRecord = new AccountDetails()

    beforeEach(() => {
      props = {
        showAcknowledgement: () => {},
        fetchAccountDetails: () => {},
        setPageTitle: () => {},
        loading: false,
        saving: false,
        accountDetails: AccountDetailsRecord.get('data'),
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
        expect(AccountDetailsWrapper.node.props.children.length).toEqual(2)
        expect(AccountDetailsWrapper.node.props.children[0].type).toEqual(Helmet)
        expect(AccountDetailsWrapper.node.props.children[1].type).toEqual(Paper)
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

  describe('react-redux connect', () => {
    const expectedBoundActionCreators = { value: 'Bound Action Creators' }
    let reactReduxStub
    let intlStub
    let mapStateToProps
    let mapDispatchToProps
    let reduxStub
    let accountDetailsCreatorsStub
    let acknowledgementCreatorsStub
    beforeEach(() => {
      reactReduxStub = {
        connect: sinon.stub().returns(() => {})
      }
      intlStub = {
        injectIntl: sinon.stub().returns(() => {})
      }
      reduxStub = {
        bindActionCreators: sinon.stub().returns(expectedBoundActionCreators)
      }
      accountDetailsCreatorsStub = {
        fetchAccountDetails: () => {},
        saveContactDetails: () => {},
        saveLoginDetails: () => {},
        saveUserPreferences: () => {}
      }
      acknowledgementCreatorsStub = {
        showAcknowledgement: () => {}
      }
      proxyquire('./AccountDetails', {
        'react-intl': intlStub,
        'react-redux': reactReduxStub,
        redux: reduxStub,
        '../AccountRedux': accountDetailsCreatorsStub,
        '../../appNotification/AppNotificationRedux': acknowledgementCreatorsStub
      })
      mapStateToProps = reactReduxStub.connect.firstCall.args[0]
      mapDispatchToProps = reactReduxStub.connect.firstCall.args[1]
    })

    it('mapDispatchToProps should bind fetchAccountDetails and saveAccountDetails action creators to the component\'s properties', () => {
      const expectedDispatcher = { value: 'I am a dispatch function' }
      expect(mapDispatchToProps(expectedDispatcher)).toEqual(expectedBoundActionCreators)
      expect(reduxStub.bindActionCreators.lastCall.args).toEqual([{
        showAcknowledgement: acknowledgementCreatorsStub.showAcknowledgement,
        fetchAccountDetails: accountDetailsCreatorsStub.fetchAccountDetails,
        saveContactDetails: accountDetailsCreatorsStub.saveContactDetails,
        saveLoginDetails: accountDetailsCreatorsStub.saveLoginDetails,
        saveUserPreferences: accountDetailsCreatorsStub.saveUserPreferences
      }, expectedDispatcher])
    })

    it('mapStateToProps should map loading, saving and accountDetails from accountDetails on state', () => {
      const accountDetails = {
        loading: false,
        saving: false,
        data: { value: 'This object contains the user\'s account details' }
      }
      const state = {
        accountDetails: Immutable.Map(accountDetails)
      }
      expect(mapStateToProps(state)).toEqual({
        loading: accountDetails.loading,
        saving: accountDetails.saving,
        accountDetails: accountDetails.data
      })
    })
  })
})
