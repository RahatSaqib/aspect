import Immutable from 'immutable'
import _ from 'lodash'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import accountDetails, { types } from './AccountRedux'
import {
  errorPleaseTryAgainInAFewMinutes,
  inlineWarning
} from '../error/CommonErrorNotifications'

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
    culture: 'fr-FR',
    notes: null,
    lastPartnerId: null
  }

  describe('account details reducer', () => {
    let initialState

    beforeEach(() => {
      initialState = accountDetails(undefined, {})
    })

    describe('initial state', () => {
      it('should contain an empty AccountDetails object that isn\'t loading or saving', () => {
        expect(initialState.get('data')).toBeInstanceOf(Immutable.Record)
        expect(initialState.getIn(['data', 'contactDetails'])).toBeInstanceOf(Immutable.Record)
        expect(initialState.getIn(['data', 'loginDetails'])).toBeInstanceOf(Immutable.Record)
        expect(initialState.getIn(['data', 'userPreferences'])).toBeInstanceOf(Immutable.Record)
        expect(initialState.get('loading')).toBe()
        expect(initialState.get('saving')).toBe()
        expect(initialState.getIn(['data', 'contactDetails']).toJS()).toEqual({
          id: null,
          lastPartnerId: null,
          name: null,
          title: null,
          email: null,
          email2: null,
          phone: null,
          cell: null,
          countryId: null,
          stateId: null,
          lgaId: null,
          zip: null,
          notes: null
        })
        expect(initialState.getIn(['data', 'loginDetails']).toJS()).toEqual({
          id: null,
          username: null,
          newPassword: null,
          confirmNewPassword: null,
          currentPassword: null,
          partnerId: null,
          orgUnitId: null,
          roles: []
        })
        expect(initialState.getIn(['data', 'userPreferences']).toJS()).toEqual({
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
          expect(state.get('loading')).toBe(true)
        })
      })

      describe('RECEIVE_ACCOUNT_DETAILS', () => {
        it('should show that account details are not loading anymore and populate contactDetails, loginDetails and userPreferences', () => {
          const state = accountDetails(initialState, {
            type: types.RECEIVE_ACCOUNT_DETAILS,
            accountDetails: accountDetailsData
          })
          expect(state.get('loading')).toBe()
          expect(state.getIn(['data', 'contactDetails']).toJS()).toEqual(_.omit(accountDetailsData,
            ['username', 'userId', 'timezone', 'culture']))
          expect(state.getIn(['data', 'loginDetails']).toJS()).toEqual({
            id: accountDetailsData.userId,
            username: accountDetailsData.username,
            newPassword: null,
            confirmNewPassword: null,
            currentPassword: null,
            partnerId: null,
            orgUnitId: null,
            roles: []
          })
          expect(state.getIn(['data', 'userPreferences']).toJS()).toEqual(_.pick(accountDetailsData, ['id', 'timezone', 'culture']))
        })
      })

      describe('SAVE_ACCOUNT_DETAILS_START', () => {
        it('should show that account details are busy saving', () => {
          const state = accountDetails(initialState, { type: types.SAVE_ACCOUNT_DETAILS_START })
          expect(state.get('saving')).toBe(true)
        })
      })

      describe('RECEIVE_UPDATED_CONTACT_DETAILS', () => {
        it('should show that account details are not loading anymore and populate contactDetails only', () => {
          const newAccountDetailsData = {
            id: 111,
            lastPartnerId: null,
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
            culture: 'en-GB',
            notes: null
          }
          const state = accountDetails(initialState, {
            type: types.RECEIVE_ACCOUNT_DETAILS,
            accountDetails: accountDetailsData
          })
          const newState = accountDetails(state, {
            type: types.RECEIVE_UPDATED_CONTACT_DETAILS,
            accountDetails: newAccountDetailsData
          })

          expect(newState.get('loading')).toBe()
          expect(newState.getIn(['data', 'contactDetails']).toJS()).toEqual(_.omit(newAccountDetailsData,
            ['username', 'userId', 'timezone', 'culture']))
          expect(newState.getIn(['data', 'loginDetails']).toJS()).toEqual({
            id: accountDetailsData.userId,
            username: accountDetailsData.username,
            newPassword: null,
            confirmNewPassword: null,
            currentPassword: null,
            partnerId: null,
            orgUnitId: null,
            roles: []
          })
          expect(newState.getIn(['data', 'userPreferences']).toJS()).toEqual(_.pick(accountDetailsData, ['id', 'timezone', 'culture']))
        })
      })

      describe('RECEIVE_UPDATED_LOGIN_DETAILS', () => {
        it('should show that account details are not loading anymore and populate loginDetails only', () => {
          const updateDetailsData = {
            username: 'this username was updated'
          }
          const state = accountDetails(initialState, {
            type: types.RECEIVE_ACCOUNT_DETAILS,
            accountDetails: accountDetailsData
          })
          const newState = accountDetails(state, {
            type: types.RECEIVE_UPDATED_LOGIN_DETAILS,
            updateDetails: updateDetailsData
          })

          expect(newState.get('loading')).toBe()
          expect(newState.getIn(['data', 'contactDetails']).toJS()).toEqual(_.omit(accountDetailsData,
            ['username', 'userId', 'timezone', 'culture']))
          expect(newState.getIn(['data', 'loginDetails']).toJS()).toEqual({
            id: accountDetailsData.userId,
            username: updateDetailsData.username,
            newPassword: null,
            confirmNewPassword: null,
            currentPassword: null,
            partnerId: null,
            orgUnitId: null,
            roles: []
          })
          expect(newState.getIn(['data', 'userPreferences']).toJS()).toEqual(_.pick(accountDetailsData, ['id', 'timezone', 'culture']))
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
          const state = accountDetails(initialState, {
            type: types.RECEIVE_ACCOUNT_DETAILS,
            accountDetails: accountDetailsData
          })
          const newState = accountDetails(state, {
            type: types.RECEIVE_UPDATED_USER_PREFERENCES,
            accountDetails: newAccountDetailsData
          })

          expect(newState.get('loading')).toBe()
          expect(newState.getIn(['data', 'contactDetails']).toJS()).toEqual(_.omit(accountDetailsData,
            ['username', 'userId', 'timezone', 'culture']))
          expect(newState.getIn(['data', 'loginDetails']).toJS()).toEqual({
            id: accountDetailsData.userId,
            username: accountDetailsData.username,
            newPassword: null,
            confirmNewPassword: null,
            currentPassword: null,
            partnerId: null,
            orgUnitId: null,
            roles: []
          })
          expect(newState.getIn(['data', 'userPreferences']).toJS()).toEqual(_.pick(newAccountDetailsData, ['id', 'timezone', 'culture']))
        })
      })
    })
  })

  describe('account details creators', () => {
    let accountDetailsRedux
    let dispatch

    function createAccountDetailsReduxReduxWithStubs(fetchStub) {
      const proxyDependencies = {
        '../shared/utils/browser': {
          getBrowserNameAndVersion: () => 'Mocha/Chai'
        },
        '../shared/utils/fetch': fetchStub,
        'jwt-decode': () => 'decoded-token',
        '../shared/utils/localStorage': {
          getClientId: () => 'Mocha/Chai',
          store: () => {}
        },
        '../auth/AuthRedux': {
          loginSuccess: () => {},
          changeCulture: () => {},
          changeTimezone: () => {}
        }
      }
      accountDetailsRedux = proxyquire('./AccountRedux', proxyDependencies)
    }

    describe('fetchAccountDetails', () => {
      const expectedResponseFromServer = Promise.resolve({ ok: true, data: accountDetailsData })
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
        expect(dispatch.firstCall.args).toEqual([{ type: types.REQUEST_ACCOUNT_DETAILS }])
      })

      it('should request the account details from the server', () => {
        expect(fetchStub.aspectFetch.calledWith('/account-details/current')).toBeTruthy()
      })

      describe('when a response is received from the server', () => {
        it('Should dispatch a RECEIVE_ACCOUNT_DETAILS action with the account details received', () => expectedResponseFromServer.then((response) => {
          expect(response).toEqual({ ok: true, data: accountDetailsData })
          expect(dispatch.secondCall.args).toEqual([{
            type: types.RECEIVE_ACCOUNT_DETAILS,
            accountDetails: accountDetailsData
          }])
        }))
      })
    })

    describe('saveContactDetails', () => {
      const expectedResponseFromServer = Promise.resolve({ ok: true, data: accountDetailsData })
      const stubHeaders = { value: 'Stubbed Headers' }
      const contactDetailsData = _.omit(accountDetailsData, ['username', 'userId', 'timezone', 'culture', 'notes', 'lastPartnerId'])
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
          body: JSON.stringify(contactDetailsData),
          errorNotifications: {
            default: errorPleaseTryAgainInAFewMinutes({ title: {
              id: 'errorResponseMessages.saveContactDetails.PUT.default.title',
              defaultMessage: 'Saving Contact Details Failed'
            } })
          }
        }).returns(expectedResponseFromServer)
        dispatch = sinon.spy()
        createAccountDetailsReduxReduxWithStubs(fetchStub)

        const dispatchFunction = accountDetailsRedux.saveContactDetails(contactDetailsData)
        dispatchFunction(dispatch)
      })

      it('should dispatch a SAVE_ACCOUNT_DETAILS_START action', () => {
        expect(dispatch.firstCall.args).toEqual([{ type: types.SAVE_ACCOUNT_DETAILS_START }])
      })

      it('should send a PUT request to the server with the correct headers and the account details passed to it', () => {
        expect(fetchStub.aspectFetch.calledWith('/account-details/current-contact', {
          method: 'PUT',
          headers: stubHeaders,
          body: JSON.stringify(contactDetailsData),
          errorNotifications: {
            default: errorPleaseTryAgainInAFewMinutes({ title: {
              id: 'errorResponseMessages.saveContactDetails.PUT.default.title',
              defaultMessage: 'Saving Contact Details Failed'
            } })
          }
        })).toBeTruthy()
      })

      describe('when a response is received from the server', () => {
        it('Should dispatch a RECEIVE_UPDATED_CONTACT_DETAILS action with the account details received', () => expectedResponseFromServer.then((response) => {
          expect(response).toEqual({ ok: true, data: accountDetailsData })
          expect(dispatch.secondCall.args).toEqual([{
            type: types.RECEIVE_UPDATED_CONTACT_DETAILS,
            accountDetails: accountDetailsData
          }])
        }))
      })
    })

    describe('saveLoginDetails', () => {
      const updateDetails = { value: 'login details updated' }
      const expectedResponseFromServer = Promise.resolve({ ok: true, data: updateDetails })
      const stubHeaders = { value: 'Stubbed Headers' }
      const loginDetailsData = {
        id: accountDetailsData.userId,
        username: accountDetailsData.username,
        newPassword: null,
        confirmNewPassword: null,
        currentPassword: 'current-password'
      }
      const requestData = {
        currentPassword: loginDetailsData.currentPassword,
        newUsername: loginDetailsData.username,
        newPassword: loginDetailsData.newPassword,
        clientId: 'Mocha/Chai',
        clientName: `Mocha/Chai on ${window.navigator.platform}`
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
          body: JSON.stringify(requestData),
          errorNotifications: {
            409: inlineWarning({
              title: {
                id: 'errorResponseMessages.saveLoginDetails.PUT.409.title',
                defaultMessage: 'This Username is Unavailable'
              },
              message: {
                id: 'errorResponseMessages.saveLoginDetails.PUT.409.message',
                defaultMessage: 'The username that you have entered is already in use by another user on the system'
              },
              resolution: {
                id: 'errorResponseMessages.saveLoginDetails.PUT.409.resolution',
                defaultMessage: 'Please try another username'
              }
            }),
            403: inlineWarning({
              title: {
                id: 'errorResponseMessages.saveLoginDetails.PUT.403.title',
                defaultMessage: 'Invalid Password'
              },
              message: {
                id: 'errorResponseMessages.saveLoginDetails.PUT.403.message',
                defaultMessage: 'The current password that you have entered is incorrect.'
              },
              resolution: {
                id: 'errorResponseMessages.saveLoginDetails.PUT.403.resolution',
                defaultMessage: 'Please try re-entering your password or contact us to reset your login details'
              }
            }),
            default: errorPleaseTryAgainInAFewMinutes({
              title: {
                id: 'errorResponseMessages.saveLoginDetails.PUT.default.title',
                defaultMessage: 'Saving Login Details Failed'
              }
            })
          }
        }).returns(expectedResponseFromServer)
        dispatch = sinon.spy()
        createAccountDetailsReduxReduxWithStubs(fetchStub)

        const dispatchFunction = accountDetailsRedux.saveLoginDetails(loginDetailsData)
        dispatchFunction(dispatch)
      })

      it('should dispatch a SAVE_ACCOUNT_DETAILS_START action', () => {
        expect(dispatch.firstCall.args).toEqual([{ type: types.SAVE_ACCOUNT_DETAILS_START }])
      })

      it('should send a PUT request to the server with the correct headers and the account details passed to it', () => {
        expect(fetchStub.aspectFetch.calledWith('/auth/update-login-details', {
          method: 'PUT',
          headers: stubHeaders,
          body: JSON.stringify(requestData),
          errorNotifications: {
            409: inlineWarning({
              title: {
                id: 'errorResponseMessages.saveLoginDetails.PUT.409.title',
                defaultMessage: 'This Username is Unavailable'
              },
              message: {
                id: 'errorResponseMessages.saveLoginDetails.PUT.409.message',
                defaultMessage: 'The username that you have entered is already in use by another user on the system'
              },
              resolution: {
                id: 'errorResponseMessages.saveLoginDetails.PUT.409.resolution',
                defaultMessage: 'Please try another username'
              } }),
            403: inlineWarning({
              title: {
                id: 'errorResponseMessages.saveLoginDetails.PUT.403.title',
                defaultMessage: 'Invalid Password'
              },
              message: {
                id: 'errorResponseMessages.saveLoginDetails.PUT.403.message',
                defaultMessage: 'The current password that you have entered is incorrect.'
              },
              resolution: {
                id: 'errorResponseMessages.saveLoginDetails.PUT.403.resolution',
                defaultMessage: 'Please try re-entering your password or contact us to reset your login details'
              }
            }),
            default: errorPleaseTryAgainInAFewMinutes({
              title: {
                id: 'errorResponseMessages.saveLoginDetails.PUT.default.title',
                defaultMessage: 'Saving Login Details Failed'
              }
            })
          }
        })).toBeTruthy()
      })

      describe('when a response is received from the server', () => {
        it('Should dispatch a RECEIVE_UPDATED_LOGIN_DETAILS action with the account details received', () => expectedResponseFromServer.then((response) => {
          expect(response).toEqual({ ok: true, data: updateDetails })
          expect(dispatch.thirdCall.args).toEqual([{
            type: types.RECEIVE_UPDATED_LOGIN_DETAILS,
            updateDetails
          }])
        }))
      })
    })

    describe('saveUserPreferences', () => {
      const expectedResponseFromServer = Promise.resolve({ ok: true, data: accountDetailsData })
      const stubHeaders = { value: 'Stubbed Headers' }
      const userPreferencesData = _.pick(accountDetailsData, ['id', 'timezone', 'culture'])
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
          body: JSON.stringify(userPreferencesData),
          errorNotifications: {
            default: errorPleaseTryAgainInAFewMinutes({ title: {
              id: 'errorResponseMessages.saveUserPreferences.PUT.default.title',
              defaultMessage: 'Saving User Preferences Failed'
            } })
          }
        }).returns(expectedResponseFromServer)
        dispatch = sinon.spy()
        createAccountDetailsReduxReduxWithStubs(fetchStub)

        const dispatchFunction = accountDetailsRedux.saveUserPreferences(userPreferencesData)
        dispatchFunction(dispatch)
      })

      it('should dispatch a SAVE_ACCOUNT_DETAILS_START action', () => {
        expect(dispatch.firstCall.args).toEqual([{ type: types.SAVE_ACCOUNT_DETAILS_START }])
      })

      it('should send a PUT request to the server with the correct headers and the account details passed to it', () => {
        expect(fetchStub.aspectFetch.calledWith('/account-details/current-preferences', {
          method: 'PUT',
          headers: stubHeaders,
          body: JSON.stringify(userPreferencesData),
          errorNotifications: {
            default: errorPleaseTryAgainInAFewMinutes({
              title: {
                id: 'errorResponseMessages.saveUserPreferences.PUT.default.title',
                defaultMessage: 'Saving User Preferences Failed'
              }
            })
          }
        })).toBeTruthy()
      })

      describe('when a response is received from the server', () => {
        it('Should dispatch a RECEIVE_UPDATED_USER_PREFERENCES action with the account details received', () => expectedResponseFromServer.then((response) => {
          expect(response).toEqual({ ok: true, data: accountDetailsData })
          expect(dispatch.getCall(3).args).toEqual([{
            type: types.RECEIVE_UPDATED_USER_PREFERENCES,
            accountDetails: accountDetailsData
          }])
        }))
      })
    })
  })
})
