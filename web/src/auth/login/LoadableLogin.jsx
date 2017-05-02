import makeLoadable from 'react-loadable'

export default makeLoadable({
  loader: () => import('./Login'),
  LoadingComponent: () => false,
})
