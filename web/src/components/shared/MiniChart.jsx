// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
import {
  injectIntl
} from 'react-intl'
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines'
import Paper from 'material-ui/Paper'

require('./MiniChart.scss')

class MiniChart extends PureComponent {

  static propTypes = {
    bgcolor: PropTypes.string.isRequired,
    data: PropTypes.array.isRequired,
    label: PropTypes.string.isRequired,
    number: PropTypes.any.isRequired
  }

  render() {
    const { intl } = this.props
    const { formatNumber } = intl

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
              {formatNumber(this.props.number)}
          </div>
          <div className="clear-fix" ></div>
        </Paper>
      )
  }
}

export default injectIntl(MiniChart)
