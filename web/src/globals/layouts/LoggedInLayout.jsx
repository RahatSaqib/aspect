import classnames from 'classnames/bind'
import React from 'react'
import { Route } from 'react-router'
import Helmet from 'react-helmet'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { compose, pure } from 'recompose'
import { Layout, NavDrawer, Panel } from 'react-toolbox/lib/layout'
import AppBar from 'react-toolbox/lib/app_bar'
import Navigation from 'react-toolbox/lib/navigation'
import { IconMenu, MenuItem, MenuDivider } from 'react-toolbox/lib/menu'
import MdMenuIcon from 'react-icons/lib/md/menu'

import {
  refreshStart,
  logoutStart,
  navigateRoot,
  goToExternalHelp,
  navigateCurrentAccountDetails,
  toggleDrawer,
  closeDrawer,
} from '../../auth/AuthRedux'
import { IdleDialogContainer } from '../../idle/dialog/IdleDialog'
import AppNotificationSnackBar from '../../appNotification/AppNotificationSnackBar'
import AppNotificationDialog from '../../appNotification/AppNotificationDialog'
import Link from '../../components/shared/Link'
import UIProviders from './UIProviders'
import ScrollToTopOnUpdate from './ScrollToTopOnUpdate'
import EnsureAuthorized from './EnsureAuthorized'

const cssClasses = classnames.bind(require('./LoggedInLayout.css'))

const ConfluenceIcon = () =>
  <img
    className={cssClasses('ConfluenceIcon')}
    src={require('./logo_confluence.png')}
    alt=""
  />

const GithubIcon = () =>
  <svg viewBox="0 0 284 277">
    <g>
      <path d="M141.888675,0.0234927555 C63.5359948,0.0234927555 0,63.5477395 0,141.912168 C0,204.6023 40.6554239,257.788232 97.0321356,276.549924 C104.12328,277.86336 106.726656,273.471926 106.726656,269.724287 C106.726656,266.340838 106.595077,255.16371 106.533987,243.307542 C67.0604204,251.890693 58.7310279,226.56652 58.7310279,226.56652 C52.2766299,210.166193 42.9768456,205.805304 42.9768456,205.805304 C30.1032937,196.998939 43.9472374,197.17986 43.9472374,197.17986 C58.1953153,198.180797 65.6976425,211.801527 65.6976425,211.801527 C78.35268,233.493192 98.8906827,227.222064 106.987463,223.596605 C108.260955,214.426049 111.938106,208.166669 115.995895,204.623447 C84.4804813,201.035582 51.3508808,188.869264 51.3508808,134.501475 C51.3508808,119.01045 56.8936274,106.353063 65.9701981,96.4165325 C64.4969882,92.842765 59.6403297,78.411417 67.3447241,58.8673023 C67.3447241,58.8673023 79.2596322,55.0538738 106.374213,73.4114319 C117.692318,70.2676443 129.83044,68.6910512 141.888675,68.63701 C153.94691,68.6910512 166.09443,70.2676443 177.433682,73.4114319 C204.515368,55.0538738 216.413829,58.8673023 216.413829,58.8673023 C224.13702,78.411417 219.278012,92.842765 217.804802,96.4165325 C226.902519,106.353063 232.407672,119.01045 232.407672,134.501475 C232.407672,188.998493 199.214632,200.997988 167.619331,204.510665 C172.708602,208.913848 177.243363,217.54869 177.243363,230.786433 C177.243363,249.771339 177.078889,265.050898 177.078889,269.724287 C177.078889,273.500121 179.632923,277.92445 186.825101,276.531127 C243.171268,257.748288 283.775,204.581154 283.775,141.912168 C283.775,63.5477395 220.248404,0.0234927555 141.888675,0.0234927555" />
    </g>
  </svg>

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
          navigateRoot,
          goToExternalHelp,
          navigateCurrentAccountDetails,
          toggleDrawer,
          closeDrawer,
        },
        dispatch
      )
  ),
  pure
)

const LoggedInLayout = ({
  component: Component,
  render,
  pageTitle,
  drawerOpen,
  refreshStart,
  logoutStart,
  navigateRoot,
  goToExternalHelp,
  navigateCurrentAccountDetails,
  toggleDrawer,
  closeDrawer,
  ...restProps
}) =>
  <Route
    {...restProps}
    render={props => {
      const makeLink = (href, label, restProps) =>
        <Link
          {...restProps}
          key={href}
          history={props.history}
          location={props.location}
          theme={{
            link: cssClasses('Link__link'),
            active: cssClasses('Link__active'),
            icon: cssClasses('Link__icon'),
          }}
          href={href}
          label={label}
          title={label}
          onClick={closeDrawer}
        />
      const navLinks = [
        makeLink('/dashboard', 'Home'),
        makeLink('/task-list', 'Task List'),
        makeLink('/operational-data', 'Operational Data'),
        makeLink('/clinical-indicators', 'Clinical Indicators'),
        makeLink('/browse', 'Browse'),
        makeLink('/reports', 'Reports'),
        makeLink('/manage', 'Manage'),
      ]
      return (
        <UIProviders>
          <EnsureAuthorized
            refreshStart={refreshStart}
            location={props.location}
          >
            <ScrollToTopOnUpdate location={props.location}>
              <Layout>
                <NavDrawer active={drawerOpen} onOverlayClick={toggleDrawer}>
                  <Navigation
                    type="vertical"
                    className={cssClasses('Navigation--vertical')}
                  >
                    {navLinks}
                    {makeLink('/account-details/current', '', {
                      icon: <GithubIcon />,
                    })}
                  </Navigation>
                </NavDrawer>
                <Panel className={cssClasses('Panel')}>
                  <AppBar
                    leftIcon={<MdMenuIcon />}
                    onLeftIconClick={toggleDrawer}
                    rightIcon={<ConfluenceIcon />}
                    onRightIconClick={navigateRoot}
                    theme={{
                      appBar: cssClasses(
                        'AppBar__appBar',
                        'AppBar__appBar--xs'
                      ),
                      leftIcon: cssClasses('AppBar__leftIcon'),
                    }}
                  />
                  <AppBar
                    leftIcon={<ConfluenceIcon />}
                    onLeftIconClick={navigateRoot}
                    theme={{
                      appBar: cssClasses(
                        'AppBar__appBar',
                        'AppBar__appBar--sm'
                      ),
                      leftIcon: cssClasses('AppBar__leftIcon'),
                    }}
                  >
                    <Navigation
                      type="horizontal"
                      className={cssClasses(
                        'Navigation',
                        'Navigation--horizontal'
                      )}
                    >
                      {navLinks}
                    </Navigation>
                    <IconMenu
                      icon={<GithubIcon />}
                      theme={{ icon: cssClasses('IconMenu__icon') }}
                      position="topRight"
                      menuRipple
                    >
                      <MenuItem caption="Help" onClick={goToExternalHelp} />
                      <MenuItem
                        caption="Account Details"
                        onClick={navigateCurrentAccountDetails}
                      />
                      <MenuDivider />
                      <MenuItem caption="Sign out" onClick={logoutStart} />
                    </IconMenu>
                  </AppBar>
                  <Helmet title="Aspect" defaultTitle="Aspect" />
                  <div className={cssClasses('Content')}>
                    {render ? render(props) : <Component {...props} />}
                  </div>
                  <IdleDialogContainer />
                  <AppNotificationDialog />
                  <AppNotificationSnackBar />
                </Panel>
              </Layout>
            </ScrollToTopOnUpdate>
          </EnsureAuthorized>
        </UIProviders>
      )
    }}
  />

export default enhance(LoggedInLayout)
