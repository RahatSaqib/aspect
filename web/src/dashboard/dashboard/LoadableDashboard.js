import makeLoadable from 'react-loadable'

export default makeLoadable({
  loader: () => import('./Dashboard'),
  LoadingComponent: () => false,
})
