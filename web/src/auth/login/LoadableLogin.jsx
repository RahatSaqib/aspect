import makeLoadable from '@react-loadable/revised'

export default makeLoadable({
  loader: () => import('./Login'),
  loading: () => false,
})
