import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import Immutable from 'immutable'
import LinearProgress from 'material-ui/LinearProgress'
import Paper from 'material-ui/Paper'
import {Tabs, Tab} from 'material-ui/Tabs'
import ContactDetailsForm from './ContactDetailsForm'

describe('AccountDetails Component', () => {
  describe('AccountDetails', () => {
    const fakeReactRedux = {
        connect: () => component => component
      }, fakeRedux = {
        bindActionCreators: (actionCreators) => actionCreators
      }, AccountDetails = proxyquire('./AccountDetails', {
        'react-redux': fakeReactRedux,
        'redux': fakeRedux
      }).AccountDetailsContainer

    let props, AccountDetailsWrapper

    const shallowRenderAccountDetails = () => {
      AccountDetailsWrapper = shallow(<AccountDetails {...props} />)
    }

    beforeEach(() => {
      props = {
        fetchAccountDetails: () => {},
        loading: false,
        saving: false,
        accountDetails: {},
        saveAccountDetails: () => {}
      }
      shallowRenderAccountDetails(props)
    })

    it('Should be a div', () => {
      assert.equal(AccountDetailsWrapper.node.type, 'div')
    })

    describe('When loading is true', () => {
      beforeEach(() => {
        props.loading = true
        shallowRenderAccountDetails(props)
      })

      it('Should show a loading message and a progress bar', () => {
        assert.equal(AccountDetailsWrapper.findWhere(element => element.type() === 'span' && element.text() === 'Loading...').length, 1)
        assert.equal(AccountDetailsWrapper.find(LinearProgress).length, 1)
      })

      it('Should not show anything else', () => {
        assert.equal(AccountDetailsWrapper.node.props.children.length, 3)
        assert.equal(AccountDetailsWrapper.node.props.children[0].type, 'span')
        assert.equal(AccountDetailsWrapper.node.props.children[1].type, LinearProgress)
        assert.isFalse(AccountDetailsWrapper.node.props.children[2])
      })
    })

    describe('When loading is false', () => {
      it('Should not show a loading message and a progress bar', () => {
        assert.equal(AccountDetailsWrapper.findWhere(element => element.type() === 'span' && element.text() === 'Loading...').length, 0)
        assert.equal(AccountDetailsWrapper.find(LinearProgress).length, 0)
      })

      it('Should show a paper container with three tabs', () => {
        assert.equal(AccountDetailsWrapper.node.props.children.length, 3)
        assert.isFalse(AccountDetailsWrapper.node.props.children[0])
        assert.isFalse(AccountDetailsWrapper.node.props.children[1])
        assert.equal(AccountDetailsWrapper.node.props.children[2].type, Paper)
        const paperContainer = AccountDetailsWrapper.find(Paper)
        assert.equal(paperContainer.length, 1)
        const tabsContainer = paperContainer.find(Tabs)
        assert.equal(tabsContainer.children().length, 3)
      })

      it('Should show a Contact Details tab containing a contact details form', () => {
        const firstTab = AccountDetailsWrapper.find(Tab).first()
        assert.equal(firstTab.props().label, 'Contact Details')
        assert.equal(firstTab.children().length, 1)
        assert.equal(firstTab.children().first().type(), ContactDetailsForm)
        assert.equal(firstTab.children().first().props().initialValues, props.accountDetails)
        assert.equal(firstTab.children().first().props().onSubmit, props.saveAccountDetails)
      })

      it('Should show a Login Details tab', () => {
        assert.equal(AccountDetailsWrapper.findWhere(element => element.type() === Tab && element.props().label === 'Login Details').length, 1)
      })

      it('Should show a User Preferences tab', () => {
        assert.equal(AccountDetailsWrapper.find(Tab).last().props().label, 'User Preferences')
      })
    })
  })

  describe('react-redux connect', () => {
    const expectedBoundActionCreators = { value: 'Bound Action Creators' }
    let reactReduxStub, mapStateToProps, mapDispatchToProps, reduxStub, accountDetailsCreatorsStub
    beforeEach(() => {
      reactReduxStub = {
        connect: sinon.stub().returns(() => {})
      }
      reduxStub = {
        bindActionCreators: sinon.stub().returns(expectedBoundActionCreators)
      }
      accountDetailsCreatorsStub = {
        fetchAccountDetails: () => {},
        saveAccountDetails: () => {}
      }
      proxyquire('./AccountDetails', {
        'react-redux': reactReduxStub,
        'redux': reduxStub,
        '../../../action_creators/accountDetails_creators': accountDetailsCreatorsStub
      })
      mapStateToProps = reactReduxStub.connect.firstCall.args[0]
      mapDispatchToProps = reactReduxStub.connect.firstCall.args[1]
    })

    it('mapDispatchToProps should bind fetchAccountDetails and saveAccountDetails action creators to the component\'s properties', () => {
      const expectedDispatcher = {value: 'I am a dispatch function'}
      assert.equal(mapDispatchToProps(expectedDispatcher), expectedBoundActionCreators)
      assert.deepEqual(reduxStub.bindActionCreators.lastCall.args, [accountDetailsCreatorsStub, expectedDispatcher])
    })

    it('mapStateToProps should map loading, saving and accountDetails from accountDetails on state', () => {
      const accountDetails = {
          loading: false,
          saving: false,
          data: {value: 'This object contains the user\'s account details'}
        }, state = {
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
