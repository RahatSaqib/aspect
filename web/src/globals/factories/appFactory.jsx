import React from 'react'
import { compose } from 'recompose'
import { AppContainer } from 'react-hot-loader'
import { Provider } from 'react-redux'

import ConnectedIntlProvider from '../components/ConnectedIntlProvider'
import uiProvidersFactory from './uiProvidersFactory'
import routerFactory from './routerFactory'

export const appFactory = compose(
  render => ({ store }) =>
    <AppContainer>
      <Provider store={store}>
        {render()}
      </Provider>
    </AppContainer>,
  render => () =>
    <ConnectedIntlProvider>
      {render()}
    </ConnectedIntlProvider>,
  uiProvidersFactory,
  routerFactory
)

export default appFactory
