import _ from 'lodash'
import PropTypes from 'prop-types'
import { compose, setPropTypes, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { setNavTitle } from '../GlobalsRedux'

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
    componentWillMount() {
      this.props.setNavTitle(this.props.title)
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.title !== nextProps.title) {
        this.props.setNavTitle(nextProps.title)
      }
    },
  })
)

const NavTitle = _.constant(false)

export default enhance(NavTitle)
