import constant from 'lodash/constant'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { compose, setPropTypes, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { setNavTitle } from '../store/GlobalsRedux'

const enhance = compose(
  setPropTypes({
    title: PropTypes.string,
  }),
  connect(null, dispatch =>
    bindActionCreators(
      {
        setNavTitle,
      },
      dispatch
    )
  ),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.setNavTitle(this.props.title)
    },

    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.title !== nextProps.title) {
        this.props.setNavTitle(nextProps.title)
      }
    },
  })
)

const NavTitle = constant(false)

export default enhance(NavTitle)
