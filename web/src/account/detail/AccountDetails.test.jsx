import React from 'react'
import { assert } from 'chai'
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
        addAcknowledgement: () => {},
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
        },
        addAcknowledgement: () => {}
      }
      shallowRenderAccountDetails()
    })

    it('Should be a div', () => {
      assert.equal(AccountDetailsWrapper.node.type, 'div')
    })

    describe('When loading is true', () => {
      beforeEach(() => {
        props.loading = true
        shallowRenderAccountDetails()
      })

      it('Should show a progress bar in each tab', () => {
        const firstTab = AccountDetailsWrapper.find(Tab).first()
        assert.equal(firstTab.find(LinearProgress).length, 1)
        const secondTab = AccountDetailsWrapper.find(Tab).at(1)
        assert.equal(secondTab.find(LinearProgress).length, 1)
        const thirdTab = AccountDetailsWrapper.find(Tab).at(2)
        assert.equal(thirdTab.find(LinearProgress).length, 1)
      })
    })

    describe('When loading is false', () => {
      it('Should not show a loading message and a progress bar', () => {
        assert.equal(AccountDetailsWrapper.findWhere(element => element.type() === 'span' && element.text() === 'Loading...').length, 0)
        assert.equal(AccountDetailsWrapper.find(LinearProgress).length, 0)
      })

      it('Should show a paper container with three tabs', () => {
        assert.equal(AccountDetailsWrapper.node.props.children.length, 2)
        assert.equal(AccountDetailsWrapper.node.props.children[0].type, Helmet)
        assert.equal(AccountDetailsWrapper.node.props.children[1].type, Paper)
        const paperContainer = AccountDetailsWrapper.find(Paper)
        assert.equal(paperContainer.length, 1)
        const tabsContainer = paperContainer.find(Tabs)
        assert.equal(tabsContainer.children().length, 3)
      })

      it('Should show a Contact Details tab containing a contact details form', () => {
        const firstTab = AccountDetailsWrapper.find(Tab).first()
        assert.equal(firstTab.props().label.props.children, 'Contact Details')
        assert.equal(firstTab.find(Visible).children().text(), 'Contact Details')

        const contactDetailsForm = firstTab.find(ContactDetailsForm)
        assert.equal(contactDetailsForm.props().initialValues, props.accountDetails.get('contactDetails'))
        assert.equal(contactDetailsForm.props().onSubmit, props.saveContactDetails)
      })

      it('Should show a Login Details tab', () => {
        const secondTab = AccountDetailsWrapper.find(Tab).at(1)
        assert.equal(secondTab.props().label.props.children, 'Username & Password')
        assert.equal(secondTab.find(Visible).children().text(), 'Username & Password')

        const loginDetailsForm = secondTab.find(LoginDetailsForm)
        assert.equal(loginDetailsForm.props().initialValues, props.accountDetails.get('loginDetails'))
        assert.equal(loginDetailsForm.props().onSubmit, props.saveLoginDetails)
      })

      it('Should show a User Preferences tab', () => {
        const thirdTab = AccountDetailsWrapper.find(Tab).at(2)
        assert.equal(thirdTab.props().label.props.children, 'Language & Timezone')
        assert.equal(thirdTab.find(Visible).children().text(), 'Language & Timezone')

        const userPreferencesForm = thirdTab.find(UserPreferencesForm)
        assert.equal(userPreferencesForm.props().initialValues, props.accountDetails.get('userPreferences'))
        assert.equal(userPreferencesForm.props().onSubmit, props.saveUserPreferences)
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
        addAcknowledgement: () => {}
      }
      proxyquire('./AccountDetails', {
        'react-intl': intlStub,
        'react-redux': reactReduxStub,
        redux: reduxStub,
        '../AccountRedux': accountDetailsCreatorsStub,
        '../../acknowledgement/AcknowledgementRedux': acknowledgementCreatorsStub
      })
      mapStateToProps = reactReduxStub.connect.firstCall.args[0]
      mapDispatchToProps = reactReduxStub.connect.firstCall.args[1]
    })

    it('mapDispatchToProps should bind fetchAccountDetails and saveAccountDetails action creators to the component\'s properties', () => {
      const expectedDispatcher = { value: 'I am a dispatch function' }
      assert.equal(mapDispatchToProps(expectedDispatcher), expectedBoundActionCreators)
      assert.deepEqual(reduxStub.bindActionCreators.lastCall.args, [{
        addAcknowledgement: acknowledgementCreatorsStub.addAcknowledgement,
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
      assert.deepEqual(mapStateToProps(state), {
        loading: accountDetails.loading,
        saving: accountDetails.saving,
        accountDetails: accountDetails.data
      })
    })
  })
})
