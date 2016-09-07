// Imports from packages
import React from 'react'
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines'
import Paper from 'material-ui/Paper'

// Our own imports
import FormattedNumber from './FormattedNumber'

require('./../../styles/Charts.css')

class MiniChart extends React.PureComponent {

  static propTypes = {
    bgcolor: React.PropTypes.string.isRequired,
    data: React.PropTypes.array.isRequired,
    label: React.PropTypes.string.isRequired,
    number: React.PropTypes.any.isRequired,
    culture: React.PropTypes.string.isRequired
  }

  render() {
    return (
        <Paper className="col-margin" style={{backgroundColor: this.props.bgcolor}}>
          <div className="minichart-chart">
            <Sparklines data={this.props.data} width={100} height={80} margin={15} >
                <SparklinesLine color={'#fff'} style={{fill: 'none'}} />
                <SparklinesSpots style={{ fill: '#fff' }}  />
            </Sparklines>
          </div>
          <div className="minichart-count">
              <small>{this.props.label}</small>
              <FormattedNumber number={this.props.number} culture={this.props.culture} />
          </div>
          <div className="clear-fix" ></div>
        </Paper>
      )
  }
}

export default MiniChart
