import { assert } from 'chai'
import Immutable from 'immutable'
import _ from 'lodash'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import accountDetails, {types} from './AccountRedux'

describe('AccountDetailsRedux', () => {
  const accountDetailsData = {
    id: 111,
    username: 'logged-in-user',
    userId: 123,
    name: 'John Smith',
    title: 'Analyst',
    email: 'jsmith@systemone.id',
    email2: 'johnsmith69@hotmail.com',
    phone: '+1 011234234566',
    cell: '+44 0788826637',
    countryId: 1,
    stateId: 2,
    lgaId: 3,
    zip: 'ZIP 123',
    timezone: 'Pacific Standard Time',
    culture: 'fr-FR'
  }

  describe('account details reducer', () => {
    let initialState

    beforeEach(()=>{
      initialState = accountDetails(undefined, {})
    })

    describe('initial state', () => {
      it('should contain an empty AccountDetails object that isn\'t loading or saving', () => {
        assert.instanceOf(initialState.get('data'), Immutable.Record)
        assert.instanceOf(initialState.getIn(['data', 'contactDetails']), Immutable.Record)
        assert.instanceOf(initialState.getIn(['data', 'loginDetails']), Immutable.Record)
        assert.instanceOf(initialState.getIn(['data', 'userPreferences']), Immutable.Record)
        assert.isFalse(initialState.get('loading'))
        assert.isFalse(initialState.get('saving'))
        assert.deepEqual(initialState.getIn(['data', 'contactDetails']).toJS(), {
          id: null,
          name: null,
          title: null,
          email: null,
          email2: null,
          phone: null,
          cell: null,
          countryId: null,
          stateId: null,
          lgaId: null,
          zip: null
        })
        assert.deepEqual(initialState.getIn(['data', 'loginDetails']).toJS(), {
          id: null,
          username: null,
          newPassword: null,
          confirmNewPassword: null,
          currentPassword: null,
          incorrectCurrentPasswordEntered: false
        })
        assert.deepEqual(initialState.getIn(['data', 'userPreferences']).toJS(), {
          id: null,
          timezone: null,
          culture: null
        })
      })
    })

    describe('actions', () => {
      describe('REQUEST_ACCOUNT_DETAILS', () => {
        it('should show that account details are busy loading', () => {
          const state = accountDetails(initialState, { type: types.REQUEST_ACCOUNT_DETAILS })
          assert.isTrue(state.get('loading'))
        })
      })

      describe('RECEIVE_ACCOUNT_DETAILS', () => {
        it('should show that account details are not loading anymore and populate contactDetails, loginDetails and userPreferences', () => {
          const state = accountDetails(initialState, { type: types.RECEIVE_ACCOUNT_DETAILS, accountDetails: accountDetailsData })
          assert.isFalse(state.get('loading'))
          assert.deepEqual(state.getIn(['data', 'contactDetails']).toJS(), _.omit(accountDetailsData,
            ['username', 'userId', 'timezone', 'culture']))
          assert.deepEqual(state.getIn(['data', 'loginDetails']).toJS(), {
            id: accountDetailsData.userId,
            username: accountDetailsData.username,
            newPassword: null,
            confirmNewPassword: null,
            currentPassword: null,
            incorrectCurrentPasswordEntered: false
          })
          assert.deepEqual(state.getIn(['data', 'userPreferences']).toJS(), _.pick(accountDetailsData, ['id', 'timezone', 'culture']))
        })
      })

      describe('SAVE_ACCOUNT_DETAILS_START', () => {
        it('should show that account details are busy saving', () => {
          const state = accountDetails(initialState, { type: types.SAVE_ACCOUNT_DETAILS_START })
          assert.isTrue(state.get('saving'))
        })
      })

      describe('RECEIVE_UPDATED_CONTACT_DETAILS', () => {
        it('should show that account details are not loading anymore and populate contactDetails only', () => {
          const newAccountDetailsData = {
            id: 111,
            username: 'new-username',
            userId: 123,
            name: 'John Hank Smith',
            title: 'Senior Manager',
            email: 'jsmith@systemone.co',
            email2: 'johnsmith69@gmail.com',
            phone: '+1 0234234',
            cell: '+27 0833243682',
            countryId: 3,
            stateId: 2,
            lgaId: 1,
            zip: '123 ZIP',
            timezone: 'Eastern Standard Time',
            culture: 'en-GB'
          }
          const state = accountDetails(initialState, { type: types.RECEIVE_ACCOUNT_DETAILS, accountDetails: accountDetailsData })
          const newState = accountDetails(state, { type: types.RECEIVE_UPDATED_CONTACT_DETAILS, accountDetails: newAccountDetailsData })

          assert.isFalse(newState.get('loading'))
          assert.deepEqual(newState.getIn(['data', 'contactDetails']).toJS(), _.omit(newAccountDetailsData,
            ['username', 'userId', 'timezone', 'culture']))
          assert.deepEqual(newState.getIn(['data', 'loginDetails']).toJS(), {
            id: accountDetailsData.userId,
            username: accountDetailsData.username,
            newPassword: null,
            confirmNewPassword: null,
            currentPassword: null,
            incorrectCurrentPasswordEntered: false
          })
          assert.deepEqual(newState.getIn(['data', 'userPreferences']).toJS(), _.pick(accountDetailsData, ['id', 'timezone', 'culture']))
        })
      })

      describe('RECEIVE_UPDATED_LOGIN_DETAILS', () => {
        it('should show that account details are not loading anymore and populate loginDetails only', () => {
          const updateDetailsData = {
            username: 'this username was updated'
          }
          const state = accountDetails(initialState, { type: types.RECEIVE_ACCOUNT_DETAILS, accountDetails: accountDetailsData })
          const newState = accountDetails(state, { type: types.RECEIVE_UPDATED_LOGIN_DETAILS, updateDetails: updateDetailsData })

          assert.isFalse(newState.get('loading'))
          assert.deepEqual(newState.getIn(['data', 'contactDetails']).toJS(), _.omit(accountDetailsData,
            ['username', 'userId', 'timezone', 'culture']))
          assert.deepEqual(newState.getIn(['data', 'loginDetails']).toJS(), {
            id: accountDetailsData.userId,
            username: updateDetailsData.username,
            newPassword: null,
            confirmNewPassword: null,
            currentPassword: null,
            incorrectCurrentPasswordEntered: false
          })
          assert.deepEqual(newState.getIn(['data', 'userPreferences']).toJS(), _.pick(accountDetailsData, ['id', 'timezone', 'culture']))
        })
      })

      describe('RECEIVE_UPDATED_USER_PREFERENCES', () => {
        it('should show that account details are not loading anymore and populate userPreferences only', () => {
          const newAccountDetailsData = {
            id: 111,
            username: 'new-username',
            userId: 123,
            name: 'John Hank Smith',
            title: 'Senior Manager',
            email: 'jsmith@systemone.co',
            email2: 'johnsmith69@gmail.com',
            phone: '+1 0234234',
            cell: '+27 0833243682',
            countryId: 3,
            stateId: 2,
            lgaId: 1,
            zip: '123 ZIP',
            timezone: 'Eastern Standard Time',
            culture: 'en-GB'
          }
          const state = accountDetails(initialState, { type: types.RECEIVE_ACCOUNT_DETAILS, accountDetails: accountDetailsData })
          const newState = accountDetails(state, { type: types.RECEIVE_UPDATED_USER_PREFERENCES, accountDetails: newAccountDetailsData })

          assert.isFalse(newState.get('loading'))
          assert.deepEqual(newState.getIn(['data', 'contactDetails']).toJS(), _.omit(accountDetailsData,
            ['username', 'userId', 'timezone', 'culture']))
          assert.deepEqual(newState.getIn(['data', 'loginDetails']).toJS(), {
            id: accountDetailsData.userId,
            username: accountDetailsData.username,
            newPassword: null,
            confirmNewPassword: null,
            currentPassword: null,
            incorrectCurrentPasswordEntered: false
          })
          assert.deepEqual(newState.getIn(['data', 'userPreferences']).toJS(), _.pick(newAccountDetailsData, ['id', 'timezone', 'culture']))
        })
      })
    })
  })

  describe('account details creators', () => {
    let accountDetailsRedux, dispatch

    function createAccountDetailsReduxReduxWithStubs(fetchStub, errorCreatorsStub) {
      if(!fetchStub.getBrowserNameAndVersion) {
        fetchStub.getBrowserNameAndVersion = () => 'Mocha/Chai'
      }
      const proxyDependencies = {
        '../shared/utils/fetch': fetchStub,
        'jwt-decode': () => 'decoded-token',
        '../shared/utils/localStorage': {
          getClientId: () => 'Mocha/Chai',
          store: () => {}
        },
        '../auth/AuthRedux': {
          loginSuccess: () => {}
        }
      }
      if(errorCreatorsStub) {
        proxyDependencies['../error/ErrorRedux'] = errorCreatorsStub
      }
      accountDetailsRedux = proxyquire('./AccountRedux', proxyDependencies)
    }

    describe('fetchAccountDetails', () => {
      const expectedResponseFromServer = Promise.resolve({ok: true, data: accountDetailsData})
      let fetchStub

      beforeEach(() => {
        fetchStub = {
          aspectFetch: sinon.stub()
        }
        fetchStub.aspectFetch.withArgs('/account-details/current')
          .returns(expectedResponseFromServer)
        dispatch = sinon.spy()
        createAccountDetailsReduxReduxWithStubs(fetchStub)

        const dispatchFunction = accountDetailsRedux.fetchAccountDetails()
        dispatchFunction(dispatch)
      })

      it('should dispatch a REQUEST_ACCOUNT_DETAILS action', () => {
        assert.deepEqual(dispatch.firstCall.args, [{ type: types.REQUEST_ACCOUNT_DETAILS }], 'REQUEST_ACCOUNT_DETAILS Was Not Dispatched')
      })

      it('should request the account details from the server', () => {
        assert(fetchStub.aspectFetch.calledWith('/account-details/current'), 'A request to /account-details/current was not detected')
      })

      describe('when a response is received from the server', () => {
        it('Should dispatch a RECEIVE_ACCOUNT_DETAILS action with the account details received', () => {
          return expectedResponseFromServer.then(response => {
            assert.deepEqual(response, {ok: true, data: accountDetailsData})
            assert.deepEqual(dispatch.secondCall.args, [{
              type: types.RECEIVE_ACCOUNT_DETAILS,
              accountDetails: accountDetailsData
            }])
          })
        })
      })

      describe('when the server encounters a problem', () => {
        const expectedError = {message: 'An unexpected error happened'},
          expectedErrorFromServer = Promise.reject(expectedError),
          expectedErrorAction = { type: 'ERROR' }
        let errorCreatorsStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub()
          }
          fetchStub.aspectFetch.withArgs('/account-details/current')
            .returns(expectedErrorFromServer)
          errorCreatorsStub = {
            addError: sinon.stub()
          }
          errorCreatorsStub.addError.withArgs('Loading account details failed', expectedError.message, expectedError)
            .returns(expectedErrorAction)
          dispatch = sinon.spy()
          createAccountDetailsReduxReduxWithStubs(fetchStub, errorCreatorsStub)
          const dispatchFunction = accountDetailsRedux.fetchAccountDetails()
          dispatchFunction(dispatch)
        })

        it('should dispatch a REQUEST_ACCOUNT_DETAILS action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{ type: types.REQUEST_ACCOUNT_DETAILS }], 'REQUEST_ACCOUNT_DETAILS Was Not Dispatched')
        })

        it('should request the account details from the server', () => {
          assert(fetchStub.aspectFetch.calledWith('/account-details/current'), 'A request to /account-details/current was not detected')
        })

        describe('and an error is received from the server', () => {
          it('should dispatch an error action', () => {
            return expectedErrorFromServer.then().catch(err => {
              assert.deepEqual(err, expectedError)
              assert.deepEqual(dispatch.secondCall.args, [expectedErrorAction])
            })
          })
        })
      })
    })

    describe('saveContactDetails', () => {
      const expectedResponseFromServer = Promise.resolve({ok: true, data: accountDetailsData}),
        stubHeaders = { value: 'Stubbed Headers' },
        contactDetailsData = _.omit(accountDetailsData, ['username', 'userId', 'timezone', 'culture'])
      let fetchStub

      beforeEach(() => {
        fetchStub = {
          aspectFetch: sinon.stub(),
          getHeaders: sinon.stub()
        }
        fetchStub.getHeaders.returns(stubHeaders)
        fetchStub.aspectFetch.withArgs('/account-details/current-contact', {
          method: 'PUT',
          headers: stubHeaders,
          body: JSON.stringify(contactDetailsData)
        }).returns(expectedResponseFromServer)
        dispatch = sinon.spy()
        createAccountDetailsReduxReduxWithStubs(fetchStub)

        const dispatchFunction = accountDetailsRedux.saveContactDetails(contactDetailsData)
        dispatchFunction(dispatch)
      })

      it('should dispatch a SAVE_ACCOUNT_DETAILS_START action', () => {
        assert.deepEqual(dispatch.firstCall.args, [{ type: types.SAVE_ACCOUNT_DETAILS_START }], 'SAVE_ACCOUNT_DETAILS_START Was Not Dispatched')
      })

      it('should send a PUT request to the server with the correct headers and the account details passed to it', () => {
        assert(fetchStub.aspectFetch.calledWith('/account-details/current-contact', {
          method: 'PUT',
          headers: stubHeaders,
          body: JSON.stringify(contactDetailsData)
        }), 'A PUT to /account-details/current-contact was not detected')
      })

      describe('when a response is received from the server', () => {
        it('Should dispatch a RECEIVE_UPDATED_CONTACT_DETAILS action with the account details received', () => {
          return expectedResponseFromServer.then(response => {
            assert.deepEqual(response, {ok: true, data: accountDetailsData})
            assert.deepEqual(dispatch.secondCall.args, [{
              type: types.RECEIVE_UPDATED_CONTACT_DETAILS,
              accountDetails: accountDetailsData
            }])
          })
        })
      })

      describe('when the server encounters a problem', () => {
        const expectedError = {message: 'An unexpected error happened'},
          expectedErrorFromServer = Promise.reject(expectedError),
          expectedErrorAction = { type: 'ERROR' }
        let errorCreatorsStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub(),
            getHeaders: sinon.stub()
          }
          fetchStub.getHeaders.returns(stubHeaders)
          fetchStub.aspectFetch.withArgs('/account-details/current-contact', {
            method: 'PUT',
            headers: stubHeaders,
            body: JSON.stringify(contactDetailsData)
          }).returns(expectedErrorFromServer)
          errorCreatorsStub = {
            addError: sinon.stub()
          }
          errorCreatorsStub.addError.withArgs('Saving contact details failed', expectedError.message, expectedError)
            .returns(expectedErrorAction)
          dispatch = sinon.spy()
          createAccountDetailsReduxReduxWithStubs(fetchStub, errorCreatorsStub)
          const dispatchFunction = accountDetailsRedux.saveContactDetails(contactDetailsData)
          dispatchFunction(dispatch)
        })

        it('should dispatch a SAVE_ACCOUNT_DETAILS_START action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{ type: types.SAVE_ACCOUNT_DETAILS_START }], 'SAVE_ACCOUNT_DETAILS_START Was Not Dispatched')
        })

        it('should send a PUT request to the server with the correct headers and the account details passed to it', () => {
          assert(fetchStub.aspectFetch.calledWith('/account-details/current-contact', {
            method: 'PUT',
            headers: stubHeaders,
            body: JSON.stringify(contactDetailsData)
          }), 'A PUT to /account-details/current-contact was not detected')
        })

        describe('and an error is received from the server', () => {
          it('should dispatch an error action', () => {
            return expectedErrorFromServer.then().catch(err => {
              assert.deepEqual(err, expectedError)
              assert.deepEqual(dispatch.secondCall.args, [expectedErrorAction])
            })
          })
        })
      })
    })

    describe('saveLoginDetails', () => {
      const updateDetails = { value: 'login details updated' },
        expectedResponseFromServer = Promise.resolve({ok: true, data: updateDetails}),
        stubHeaders = { value: 'Stubbed Headers' },
        loginDetailsData = {
          id: accountDetailsData.userId,
          username: accountDetailsData.username,
          newPassword: null,
          confirmNewPassword: null,
          currentPassword: 'current-password'
        }, requestData = {
          currentPassword: loginDetailsData.currentPassword,
          newUsername: loginDetailsData.username,
          newPassword: loginDetailsData.newPassword,
          clientId: 'Mocha/Chai',
          clientName: 'Mocha/Chai on ' + window.navigator.platform
        }
      let fetchStub

      beforeEach(() => {
        fetchStub = {
          aspectFetch: sinon.stub(),
          getHeaders: sinon.stub()
        }
        fetchStub.getHeaders.returns(stubHeaders)
        fetchStub.aspectFetch.withArgs('/auth/update-login-details', {
          method: 'PUT',
          headers: stubHeaders,
          body: JSON.stringify(requestData)
        }).returns(expectedResponseFromServer)
        dispatch = sinon.spy()
        createAccountDetailsReduxReduxWithStubs(fetchStub)

        const dispatchFunction = accountDetailsRedux.saveLoginDetails(loginDetailsData)
        dispatchFunction(dispatch)
      })

      it('should dispatch a SAVE_ACCOUNT_DETAILS_START action', () => {
        assert.deepEqual(dispatch.firstCall.args, [{ type: types.SAVE_ACCOUNT_DETAILS_START }], 'SAVE_ACCOUNT_DETAILS_START Was Not Dispatched')
      })

      it('should send a PUT request to the server with the correct headers and the account details passed to it', () => {
        assert(fetchStub.aspectFetch.calledWith('/auth/update-login-details', {
          method: 'PUT',
          headers: stubHeaders,
          body: JSON.stringify(requestData)
        }), 'A PUT to /auth/update-login-details was not detected')
      })

      describe('when a response is received from the server', () => {
        it('Should dispatch a RECEIVE_UPDATED_LOGIN_DETAILS action with the account details received', () => {
          return expectedResponseFromServer.then(response => {
            assert.deepEqual(response, {ok: true, data: updateDetails})
            assert.deepEqual(dispatch.thirdCall.args, [{
              type: types.RECEIVE_UPDATED_LOGIN_DETAILS,
              updateDetails: updateDetails
            }])
          })
        })
      })

      describe('when the server encounters a problem', () => {
        const expectedError = {message: 'An unexpected error happened'},
          expectedErrorFromServer = Promise.reject(expectedError),
          expectedErrorAction = { type: 'ERROR' }
        let errorCreatorsStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub(),
            getHeaders: sinon.stub()
          }
          fetchStub.getHeaders.returns(stubHeaders)
          fetchStub.aspectFetch.withArgs('/auth/update-login-details', {
            method: 'PUT',
            headers: stubHeaders,
            body: JSON.stringify(requestData)
          }).returns(expectedErrorFromServer)
          errorCreatorsStub = {
            addError: sinon.stub()
          }
          errorCreatorsStub.addError.withArgs('Saving login details failed', expectedError.message, expectedError)
            .returns(expectedErrorAction)
          dispatch = sinon.spy()
          createAccountDetailsReduxReduxWithStubs(fetchStub, errorCreatorsStub)
          const dispatchFunction = accountDetailsRedux.saveLoginDetails(loginDetailsData)
          dispatchFunction(dispatch)
        })

        it('should dispatch a SAVE_ACCOUNT_DETAILS_START action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{ type: types.SAVE_ACCOUNT_DETAILS_START }], 'SAVE_ACCOUNT_DETAILS_START Was Not Dispatched')
        })

        it('should send a PUT request to the server with the correct headers and the account details passed to it', () => {
          assert(fetchStub.aspectFetch.calledWith('/auth/update-login-details', {
            method: 'PUT',
            headers: stubHeaders,
            body: JSON.stringify(requestData)
          }), 'A PUT to /auth/update-login-details was not detected')
        })

        describe('and an error is received from the server', () => {
          it('should dispatch an error action', () => {
            return expectedErrorFromServer.then().catch(err => {
              assert.deepEqual(err, expectedError)
              assert.deepEqual(dispatch.secondCall.args, [expectedErrorAction])
            })
          })
        })
      })
    })

    describe('saveUserPreferences', () => {
      const expectedResponseFromServer = Promise.resolve({ok: true, data: accountDetailsData}),
        stubHeaders = { value: 'Stubbed Headers' },
        userPreferencesData = _.pick(accountDetailsData, ['id', 'timezone', 'culture'])
      let fetchStub

      beforeEach(() => {
        fetchStub = {
          aspectFetch: sinon.stub(),
          getHeaders: sinon.stub()
        }
        fetchStub.getHeaders.returns(stubHeaders)
        fetchStub.aspectFetch.withArgs('/account-details/current-preferences', {
          method: 'PUT',
          headers: stubHeaders,
          body: JSON.stringify(userPreferencesData)
        }).returns(expectedResponseFromServer)
        dispatch = sinon.spy()
        createAccountDetailsReduxReduxWithStubs(fetchStub)

        const dispatchFunction = accountDetailsRedux.saveUserPreferences(userPreferencesData)
        dispatchFunction(dispatch)
      })

      it('should dispatch a SAVE_ACCOUNT_DETAILS_START action', () => {
        assert.deepEqual(dispatch.firstCall.args, [{ type: types.SAVE_ACCOUNT_DETAILS_START }], 'SAVE_ACCOUNT_DETAILS_START Was Not Dispatched')
      })

      it('should send a PUT request to the server with the correct headers and the account details passed to it', () => {
        assert(fetchStub.aspectFetch.calledWith('/account-details/current-preferences', {
          method: 'PUT',
          headers: stubHeaders,
          body: JSON.stringify(userPreferencesData)
        }), 'A PUT to /account-details/current-preferences was not detected')
      })

      describe('when a response is received from the server', () => {
        it('Should dispatch a RECEIVE_UPDATED_USER_PREFERENCES action with the account details received', () => {
          return expectedResponseFromServer.then(response => {
            assert.deepEqual(response, {ok: true, data: accountDetailsData})
            assert.deepEqual(dispatch.secondCall.args, [{
              type: types.RECEIVE_UPDATED_USER_PREFERENCES,
              accountDetails: accountDetailsData
            }])
          })
        })
      })

      describe('when the server encounters a problem', () => {
        const expectedError = {message: 'An unexpected error happened'},
          expectedErrorFromServer = Promise.reject(expectedError),
          expectedErrorAction = { type: 'ERROR' }
        let errorCreatorsStub

        beforeEach(() => {
          fetchStub = {
            aspectFetch: sinon.stub(),
            getHeaders: sinon.stub()
          }
          fetchStub.getHeaders.returns(stubHeaders)
          fetchStub.aspectFetch.withArgs('/account-details/current-preferences', {
            method: 'PUT',
            headers: stubHeaders,
            body: JSON.stringify(userPreferencesData)
          }).returns(expectedErrorFromServer)
          errorCreatorsStub = {
            addError: sinon.stub()
          }
          errorCreatorsStub.addError.withArgs('Saving user preferences failed', expectedError.message, expectedError)
            .returns(expectedErrorAction)
          dispatch = sinon.spy()
          createAccountDetailsReduxReduxWithStubs(fetchStub, errorCreatorsStub)
          const dispatchFunction = accountDetailsRedux.saveUserPreferences(userPreferencesData)
          dispatchFunction(dispatch)
        })

        it('should dispatch a SAVE_ACCOUNT_DETAILS_START action', () => {
          assert.deepEqual(dispatch.firstCall.args, [{ type: types.SAVE_ACCOUNT_DETAILS_START }], 'SAVE_ACCOUNT_DETAILS_START Was Not Dispatched')
        })

        it('should send a PUT request to the server with the correct headers and the account details passed to it', () => {
          assert(fetchStub.aspectFetch.calledWith('/account-details/current-preferences', {
            method: 'PUT',
            headers: stubHeaders,
            body: JSON.stringify(userPreferencesData)
          }), 'A PUT to /account-details/current-preferences was not detected')
        })

        describe('and an error is received from the server', () => {
          it('should dispatch an error action', () => {
            return expectedErrorFromServer.then().catch(err => {
              assert.deepEqual(err, expectedError)
              assert.deepEqual(dispatch.secondCall.args, [expectedErrorAction])
            })
          })
        })
      })
    })
  })
})
