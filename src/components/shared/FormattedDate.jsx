import React from 'react'
import { connect } from 'react-redux'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import moment from 'moment'

// This component returns a number formatted using the user's culture
class FormattedDate extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
  }

  render() {

    let date = this.props.date
    let formattedDate = ''
    
    if (date){

      let mom = moment(this.props.date).locale(this.props.culture)

      if (this.props.fromNow){
        formattedDate = mom.fromNow(this.props.omitSuffix)
      } else {
        formattedDate = mom.format(this.props.format || 'L')
      }
    }

    return (
        <span>
          {formattedDate}
        </span>
      )
  }
}

FormattedDate.propTypes = {
  // any instead of number because we might get a percentage
  date: React.PropTypes.any.isRequired,
  culture: React.PropTypes.string.isRequired,
  
  // use moment's fromNow function?
  fromNow: React.PropTypes.bool,
  omitSuffix: React.PropTypes.bool,
  
  // if not using fromNow, can pass in a moment format string
  format: React.PropTypes.string
}

function mapStateToProps(state) {
  return {
    culture: state.getIn(['user', 'culture'])
  }
}

FormattedDate = connect(mapStateToProps)(FormattedDate)

export default FormattedDate
