import makeLoadable from 'react-loadable'

export default makeLoadable({
  loader: () => import('./Status'),
  loading: () => false,
})
