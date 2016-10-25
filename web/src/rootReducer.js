import Immutable from 'immutable'
import { reducer as formReducer } from 'redux-form/immutable'
import { combineReducers } from 'redux-immutable'

import acknowledgement from './acknowledgement/AcknowledgementRedux'
import error from './error/ErrorRedux'
import filter from './filter/FilterRedux'
import user, {
  types as authTypes
} from './auth/AuthRedux'
import device from './device/DeviceRedux'
import site from './site/SiteRedux'
import result from './result/ResultRedux'
import person from './person/PersonRedux'
import accountDetails from './account/AccountRedux'
import geography from './geography/GeographyRedux'
import assay from './assay/AssayRedux'
import idle from './idle/IdleRedux'
import partner from './partner/PartnerRedux'
import organisationalUnit from './organisationalUnit/OrganisationalUnitRedux'

const appReducer = combineReducers({
  form: formReducer,
  acknowledgement,
  error,
  filter,
  user,
  device,
  site,
  person,
  accountDetails,
  result,
  geography,
  assay,
  idle,
  partner,
  organisationalUnit
})

const App = Immutable.Record({
  form: undefined,
  acknowledgement: undefined,
  error: undefined,
  filter: undefined,
  user: undefined,
  device: undefined,
  site: undefined,
  person: undefined,
  accountDetails: undefined,
  geography: undefined,
  assay: undefined,
  result: undefined,
  idle: undefined,
  partner: undefined,
  organisationalUnit: undefined
})

const initialState = new App()

export default function rootReducer(state = initialState, action) {
  let nextState = state
  // on logout, empty state
  if (action.type === authTypes.LOGOUT_SUCCESS) {
    nextState = initialState
  }

  return appReducer(nextState, action)
}
