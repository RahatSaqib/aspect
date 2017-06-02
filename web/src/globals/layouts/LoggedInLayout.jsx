import React from 'react'
import { Route } from 'react-router'
import Helmet from 'react-helmet'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { compose } from 'recompose'

import { isMobile } from '../../shared/utils/browser'
import {
  refreshStart,
  logoutStart,
  toggleDrawer,
  closeDrawer,
} from '../../auth/AuthRedux'
import { IdleDialogContainer } from '../../idle/dialog/IdleDialog'
import AppNotificationSnackBar
  from '../../appNotification/AppNotificationSnackBar'
import AppNotificationDialog from '../../appNotification/AppNotificationDialog'
import Nav from '../components/Nav'
import SideNav from '../components/SideNav'
import UIProviders from './UIProviders'
import ScrollToTopOnUpdate from './ScrollToTopOnUpdate'
import EnsureAuthorized from './EnsureAuthorized'

const enhance = compose(
  connect(
    state => ({
      pageTitle: state.globals.title,
      drawerOpen: state.getIn(['user', 'drawerOpen']),
    }),
    dispatch =>
      bindActionCreators(
        {
          refreshStart,
          logoutStart,
          toggleDrawer,
          closeDrawer,
        },
        dispatch
      )
  )
)

const LoggedInLayout = ({
  component: Component,
  pageTitle,
  refreshStart,
  logoutStart,
  drawerOpen,
  closeDrawer,
  toggleDrawer,
  ...restProps
}) => (
  <Route
    {...restProps}
    render={props => (
      <UIProviders>
        <EnsureAuthorized refreshStart={refreshStart} location={props.location}>
          <ScrollToTopOnUpdate location={props.location}>
            <div>
              <Helmet title="Aspect" defaultTitle="Aspect" />
              <Nav
                pageTitle={pageTitle}
                pagePath={props.location.pathname}
                handleHamburger={toggleDrawer}
                handleSignOut={logoutStart}
              />
              <SideNav
                open={drawerOpen}
                desktop={!isMobile()}
                pathname={props.location.pathname}
                handleClose={closeDrawer}
              />
              <div
                style={
                  drawerOpen && !isMobile() ? { paddingLeft: '190px' } : {}
                }
              >
                <Component {...props} />
              </div>
              <IdleDialogContainer />
              <AppNotificationDialog />
              <AppNotificationSnackBar />
            </div>
          </ScrollToTopOnUpdate>
        </EnsureAuthorized>
      </UIProviders>
    )}
  />
)

export default enhance(LoggedInLayout)
