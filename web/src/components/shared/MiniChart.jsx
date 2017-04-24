import PropTypes from 'prop-types'
// Imports from packages
import React from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import {
  injectIntl,
  intlShape
} from 'react-intl'
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines'
import Paper from 'material-ui/Paper'

require('./MiniChart.scss')

const enhance = compose(
  setPropTypes({
    bgcolor: PropTypes.string.isRequired,
    data: PropTypes.array.isRequired,
    label: PropTypes.string.isRequired,
    number: PropTypes.any.isRequired
  }),
  pure,
  injectIntl,
  setPropTypes({
    intl: intlShape.isRequired,
  }),
)

export const MiniChart = ({ bgcolor, data, label, number, intl }) => {
  const { formatNumber } = intl

  return (
    <Paper className="col-margin" style={{ backgroundColor: bgcolor }}>
      <div className="minichart-chart">
        <Sparklines data={data} width={100} height={80} margin={15} >
          <SparklinesLine color={'#fff'} style={{ fill: 'none' }} />
          <SparklinesSpots style={{ fill: '#fff' }} />
        </Sparklines>
      </div>
      <div className="minichart-count">
        <small>{label}</small>
        {formatNumber(number)}
      </div>
      <div className="clear-fix" />
    </Paper>
  )
}

export default enhance(MiniChart)
