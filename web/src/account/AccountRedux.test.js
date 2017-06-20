import Immutable from 'immutable'
import _ from 'lodash'

import {
  errorPleaseTryAgainInAFewMinutes,
  inlineWarning,
} from '../error/CommonErrorNotifications'

jest.mock('../shared/utils/browser')
jest.mock('../shared/utils/localStorage')

describe('AccountRedux module', () => {
  let AccountRedux
  const stubHeaders = { value: 'Stubbed Headers' }
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
    lastPartnerId: null,
  }

  describe('reducer', () => {
    let initialState

    beforeEach(() => {
      AccountRedux = require('./AccountRedux')
      initialState = AccountRedux.default(undefined, {})
    })

    describe('initial state', () => {
      it("should contain an empty AccountDetails object that isn't loading or saving", () => {
        expect(initialState.get('data')).toBeInstanceOf(Immutable.Record)
        expect(initialState.getIn(['data', 'contactDetails'])).toBeInstanceOf(
          Immutable.Record
        )
        expect(initialState.getIn(['data', 'loginDetails'])).toBeInstanceOf(
          Immutable.Record
        )
        expect(initialState.getIn(['data', 'userPreferences'])).toBeInstanceOf(
          Immutable.Record
        )
        expect(initialState.get('loading')).toBe(false)
        expect(initialState.get('saving')).toBe(false)
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
          notes: null,
        })
        expect(initialState.getIn(['data', 'loginDetails']).toJS()).toEqual({
          id: null,
          username: null,
          newPassword: null,
          confirmNewPassword: null,
          currentPassword: null,
          partnerId: null,
          jobFunctions: [],
        })
        expect(initialState.getIn(['data', 'userPreferences']).toJS()).toEqual({
          id: null,
          timezone: null,
          culture: null,
        })
      })
    })

    describe('actions', () => {
      describe('REQUEST_ACCOUNT_DETAILS', () => {
        it('should show that account details are busy loading', () => {
          const state = AccountRedux.default(initialState, {
            type: AccountRedux.types.REQUEST_ACCOUNT_DETAILS,
          })
          expect(state.get('loading')).toBe(true)
        })
      })

      describe('RECEIVE_ACCOUNT_DETAILS', () => {
        it('should show that account details are not loading anymore and populate contactDetails, loginDetails and userPreferences', () => {
          const state = AccountRedux.default(initialState, {
            type: AccountRedux.types.RECEIVE_ACCOUNT_DETAILS,
            accountDetails: accountDetailsData,
          })
          expect(state.get('loading')).toBe(false)
          expect(state.getIn(['data', 'contactDetails']).toJS()).toEqual(
            _.omit(accountDetailsData, [
              'username',
              'userId',
              'timezone',
              'culture',
            ])
          )
          expect(state.getIn(['data', 'loginDetails']).toJS()).toEqual({
            id: accountDetailsData.userId,
            username: accountDetailsData.username,
            newPassword: null,
            confirmNewPassword: null,
            currentPassword: null,
            partnerId: null,
            jobFunctions: [],
          })
          expect(state.getIn(['data', 'userPreferences']).toJS()).toEqual(
            _.pick(accountDetailsData, ['id', 'timezone', 'culture'])
          )
        })
      })

      describe('SAVE_ACCOUNT_DETAILS_START', () => {
        it('should show that account details are busy saving', () => {
          const state = AccountRedux.default(initialState, {
            type: AccountRedux.types.SAVE_ACCOUNT_DETAILS_START,
          })
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
            notes: null,
          }
          const state = AccountRedux.default(initialState, {
            type: AccountRedux.types.RECEIVE_ACCOUNT_DETAILS,
            accountDetails: accountDetailsData,
          })
          const newState = AccountRedux.default(state, {
            type: AccountRedux.types.RECEIVE_UPDATED_CONTACT_DETAILS,
            accountDetails: newAccountDetailsData,
          })

          expect(newState.get('loading')).toBe(false)
          expect(newState.getIn(['data', 'contactDetails']).toJS()).toEqual(
            _.omit(newAccountDetailsData, [
              'username',
              'userId',
              'timezone',
              'culture',
            ])
          )
          expect(newState.getIn(['data', 'loginDetails']).toJS()).toEqual({
            id: accountDetailsData.userId,
            username: accountDetailsData.username,
            newPassword: null,
            confirmNewPassword: null,
            currentPassword: null,
            partnerId: null,
            jobFunctions: [],
          })
          expect(newState.getIn(['data', 'userPreferences']).toJS()).toEqual(
            _.pick(accountDetailsData, ['id', 'timezone', 'culture'])
          )
        })
      })

      describe('RECEIVE_UPDATED_LOGIN_DETAILS', () => {
        it('should show that account details are not loading anymore and populate loginDetails only', () => {
          const updateDetailsData = {
            username: 'this username was updated',
          }
          const state = AccountRedux.default(initialState, {
            type: AccountRedux.types.RECEIVE_ACCOUNT_DETAILS,
            accountDetails: accountDetailsData,
          })
          const newState = AccountRedux.default(state, {
            type: AccountRedux.types.RECEIVE_UPDATED_LOGIN_DETAILS,
            updateDetails: updateDetailsData,
          })

          expect(newState.get('loading')).toBe(false)
          expect(newState.getIn(['data', 'contactDetails']).toJS()).toEqual(
            _.omit(accountDetailsData, [
              'username',
              'userId',
              'timezone',
              'culture',
            ])
          )
          expect(newState.getIn(['data', 'loginDetails']).toJS()).toEqual({
            id: accountDetailsData.userId,
            username: updateDetailsData.username,
            newPassword: null,
            confirmNewPassword: null,
            currentPassword: null,
            partnerId: null,
            jobFunctions: [],
          })
          expect(newState.getIn(['data', 'userPreferences']).toJS()).toEqual(
            _.pick(accountDetailsData, ['id', 'timezone', 'culture'])
          )
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
            culture: 'en-GB',
          }
          const state = AccountRedux.default(initialState, {
            type: AccountRedux.types.RECEIVE_ACCOUNT_DETAILS,
            accountDetails: accountDetailsData,
          })
          const newState = AccountRedux.default(state, {
            type: AccountRedux.types.RECEIVE_UPDATED_USER_PREFERENCES,
            accountDetails: newAccountDetailsData,
          })

          expect(newState.get('loading')).toBe(false)
          expect(newState.getIn(['data', 'contactDetails']).toJS()).toEqual(
            _.omit(accountDetailsData, [
              'username',
              'userId',
              'timezone',
              'culture',
            ])
          )
          expect(newState.getIn(['data', 'loginDetails']).toJS()).toEqual({
            id: accountDetailsData.userId,
            username: accountDetailsData.username,
            newPassword: null,
            confirmNewPassword: null,
            currentPassword: null,
            partnerId: null,
            jobFunctions: [],
          })
          expect(newState.getIn(['data', 'userPreferences']).toJS()).toEqual(
            _.pick(newAccountDetailsData, ['id', 'timezone', 'culture'])
          )
        })
      })
    })
  })

  describe('action creators', () => {
    let fetchStub
    let dispatchStub
    let result

    describe('fetchAccountDetails', () => {
      describe('when the server responds successfully', () => {
        beforeAll(() => {
          jest.resetModules().mock('../shared/utils/fetch', () => {
            const expectedResponseFromServer = Promise.resolve({
              ok: true,
              data: accountDetailsData,
            })

            fetchStub = {
              aspectFetch: jest.fn(() => expectedResponseFromServer),
            }

            return fetchStub
          })

          AccountRedux = require('./AccountRedux')

          dispatchStub = jest.fn()

          const thunk = AccountRedux.fetchAccountDetails()

          result = thunk(dispatchStub)
        })

        afterAll(() => {
          dispatchStub.mockClear()
          fetchStub.aspectFetch.mockClear()
        })

        it('should dispatch a REQUEST_ACCOUNT_DETAILS action', () => {
          expect(dispatchStub).toHaveBeenCalledWith({
            type: AccountRedux.types.REQUEST_ACCOUNT_DETAILS,
          })
        })

        it('should request the account details from the server', () => {
          expect(
            fetchStub.aspectFetch
          ).toHaveBeenCalledWith('/account-details/current', {
            errorNotifications: {
              default: errorPleaseTryAgainInAFewMinutes({
                title: {
                  id: 'errorResponseMessages.fetchAccountDetails.GET.default.title',
                  defaultMessage: 'Loading Account Details Failed',
                },
              }),
            },
          })
        })

        describe('when a response is received from the server', () => {
          it('Should dispatch a RECEIVE_ACCOUNT_DETAILS action with the account details received', () =>
            result.then(() => {
              expect(dispatchStub).toHaveBeenCalledWith({
                type: AccountRedux.types.RECEIVE_ACCOUNT_DETAILS,
                accountDetails: accountDetailsData,
              })
            }))
        })
      })
    })

    describe('saveContactDetails', () => {
      let contactDetailsData

      beforeAll(() => {
        contactDetailsData = _.omit(accountDetailsData, [
          'username',
          'userId',
          'timezone',
          'culture',
          'notes',
          'lastPartnerId',
        ])
      })

      describe('when the server responds successfully', () => {
        beforeAll(() => {
          jest.resetModules().mock('../shared/utils/fetch', () => {
            const expectedResponseFromServer = Promise.resolve({
              ok: true,
              data: accountDetailsData,
            })

            fetchStub = {
              getHeaders: jest.fn(() => stubHeaders),
              aspectFetch: jest.fn(() => expectedResponseFromServer),
            }

            return fetchStub
          })

          AccountRedux = require('./AccountRedux')

          dispatchStub = jest.fn()

          const thunk = AccountRedux.saveContactDetails(contactDetailsData)

          result = thunk(dispatchStub)
        })

        afterAll(() => {
          dispatchStub.mockClear()
          fetchStub.aspectFetch.mockClear()
        })

        it('should dispatch a SAVE_ACCOUNT_DETAILS_START action', () => {
          expect(dispatchStub).toHaveBeenCalledWith({
            type: AccountRedux.types.SAVE_ACCOUNT_DETAILS_START,
          })
        })

        it('should send a PUT request to the server with the correct headers and the account details passed to it', () => {
          expect(
            fetchStub.aspectFetch
          ).toHaveBeenCalledWith('/account-details/current-contact', {
            method: 'PUT',
            headers: stubHeaders,
            body: JSON.stringify(contactDetailsData),
            errorNotifications: {
              default: errorPleaseTryAgainInAFewMinutes({
                title: {
                  id: 'errorResponseMessages.saveContactDetails.PUT.default.title',
                  defaultMessage: 'Saving Contact Details Failed',
                },
              }),
            },
          })
        })

        describe('when a response is received from the server', () => {
          it('Should dispatch a RECEIVE_UPDATED_CONTACT_DETAILS action with the account details received', () =>
            result.then(() => {
              expect(dispatchStub).toHaveBeenCalledWith({
                type: AccountRedux.types.RECEIVE_UPDATED_CONTACT_DETAILS,
                accountDetails: accountDetailsData,
              })
            }))
        })
      })
    })

    describe('saveLoginDetails', () => {
      const updateDetails = {
        value: 'login details updated',
      }
      const loginDetailsData = {
        id: accountDetailsData.userId,
        username: accountDetailsData.username,
        newPassword: null,
        confirmNewPassword: null,
        currentPassword: 'current-password',
      }
      const requestData = {
        currentPassword: loginDetailsData.currentPassword,
        newUsername: loginDetailsData.username,
        newPassword: loginDetailsData.newPassword,
        clientId: 'Mocha/Chai',
        clientName: `Mocha/Chai on ${window.navigator.platform}`,
      }

      describe('when the server responds successfully', () => {
        beforeAll(() => {
          jest.resetModules().mock('../shared/utils/fetch', () => {
            const expectedResponseFromServer = Promise.resolve({
              ok: true,
              data: updateDetails,
            })

            fetchStub = {
              getHeaders: jest.fn(() => stubHeaders),
              aspectFetch: jest.fn(() => expectedResponseFromServer),
            }

            return fetchStub
          })

          AccountRedux = require('./AccountRedux')

          dispatchStub = jest.fn()

          const thunk = AccountRedux.saveLoginDetails(loginDetailsData)

          result = thunk(dispatchStub)
        })

        afterAll(() => {
          dispatchStub.mockClear()
          fetchStub.aspectFetch.mockClear()
        })

        it('should dispatch a SAVE_ACCOUNT_DETAILS_START action', () => {
          expect(dispatchStub).toHaveBeenCalledWith({
            type: AccountRedux.types.SAVE_ACCOUNT_DETAILS_START,
          })
        })

        it('should send a PUT request to the server with the correct headers and the account details passed to it', () => {
          expect(
            fetchStub.aspectFetch
          ).toHaveBeenCalledWith('/auth/update-login-details', {
            method: 'PUT',
            headers: stubHeaders,
            body: JSON.stringify(requestData),
            errorNotifications: {
              409: inlineWarning({
                title: {
                  id: 'errorResponseMessages.saveLoginDetails.PUT.409.title',
                  defaultMessage: 'This Username is Unavailable',
                },
                message: {
                  id: 'errorResponseMessages.saveLoginDetails.PUT.409.message',
                  defaultMessage: 'The username that you have entered is already in use by another user on the system',
                },
                resolution: {
                  id: 'errorResponseMessages.saveLoginDetails.PUT.409.resolution',
                  defaultMessage: 'Please try another username',
                },
              }),
              403: inlineWarning({
                title: {
                  id: 'errorResponseMessages.saveLoginDetails.PUT.403.title',
                  defaultMessage: 'Invalid Password',
                },
                message: {
                  id: 'errorResponseMessages.saveLoginDetails.PUT.403.message',
                  defaultMessage: 'The current password that you have entered is incorrect.',
                },
                resolution: {
                  id: 'errorResponseMessages.saveLoginDetails.PUT.403.resolution',
                  defaultMessage: 'Please try re-entering your password or contact us to reset your login details',
                },
              }),
              default: errorPleaseTryAgainInAFewMinutes({
                title: {
                  id: 'errorResponseMessages.saveLoginDetails.PUT.default.title',
                  defaultMessage: 'Saving Login Details Failed',
                },
              }),
            },
          })
        })

        describe('when a response is received from the server', () => {
          // FIXME: provide proper response for expectedResponseFromServer
          it.skip(
            'Should dispatch a RECEIVE_UPDATED_LOGIN_DETAILS action with the account details received',
            () =>
              result.then(() => {
                expect(dispatchStub).toHaveBeenLastCalledWith({
                  type: AccountRedux.types.RECEIVE_UPDATED_LOGIN_DETAILS,
                  updateDetails,
                })
              })
          )
        })
      })
    })

    describe('saveUserPreferences', () => {
      const userPreferencesData = _.pick(accountDetailsData, [
        'id',
        'timezone',
        'culture',
      ])

      describe('when the server responds successfully', () => {
        beforeAll(() => {
          jest
            .resetModules()
            .mock('../shared/utils/fetch', () => {
              const expectedResponseFromServer = Promise.resolve({
                ok: true,
                data: accountDetailsData,
              })

              fetchStub = {
                getHeaders: jest.fn(() => stubHeaders),
                aspectFetch: jest.fn(() => expectedResponseFromServer),
              }

              return fetchStub
            })
            .mock('../auth/AuthRedux', () => ({
              loginSuccess: () => {},
              changeCulture: () => {},
              changeTimezone: () => {},
            }))

          AccountRedux = require('./AccountRedux')

          dispatchStub = jest.fn()

          const thunk = AccountRedux.saveUserPreferences(userPreferencesData)

          result = thunk(dispatchStub)
        })

        afterAll(() => {
          dispatchStub.mockClear()
          fetchStub.aspectFetch.mockClear()
        })

        it('should dispatch a SAVE_ACCOUNT_DETAILS_START action', () => {
          expect(dispatchStub).toHaveBeenCalledWith({
            type: AccountRedux.types.SAVE_ACCOUNT_DETAILS_START,
          })
        })

        it('should send a PUT request to the server with the correct headers and the account details passed to it', () => {
          expect(
            fetchStub.aspectFetch
          ).toHaveBeenCalledWith('/account-details/current-preferences', {
            method: 'PUT',
            headers: stubHeaders,
            body: JSON.stringify(userPreferencesData),
            errorNotifications: {
              default: errorPleaseTryAgainInAFewMinutes({
                title: {
                  id: 'errorResponseMessages.saveUserPreferences.PUT.default.title',
                  defaultMessage: 'Saving User Preferences Failed',
                },
              }),
            },
          })
        })

        describe('when a response is received from the server', () => {
          it('Should dispatch a RECEIVE_UPDATED_USER_PREFERENCES action with the account details received', () =>
            result.then(() => {
              expect(dispatchStub).toHaveBeenCalledWith({
                type: AccountRedux.types.RECEIVE_UPDATED_USER_PREFERENCES,
                accountDetails: accountDetailsData,
              })
            }))
        })
      })
    })
  })
})
