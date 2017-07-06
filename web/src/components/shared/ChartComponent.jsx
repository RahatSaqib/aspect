import React, { Component } from 'react'
import PropTypes from 'prop-types'
import BarGraph from './BarGraph'
import ColumnGraph from './ColumnGraph'
import Alert from './Alert'
import './ChartComponent.css'

class ChartComponent extends Component {
  chooseGraph() {
    switch (this.props.type) {
      case 'column':
        return (
          <ColumnGraph
            data={this.props.data}
            color={this.props.color}
            hideTicks={this.props.hideTicks}
            hideLabel={this.props.hideLabel}
            showAxes={this.props.showAxes}
            rightLabel={this.props.rightLabel}
            spacing={this.props.spacing}
            numLabelSize={this.props.numLabelSize}
          />
        )
      case 'bar':
      default:
        return (
          <BarGraph
            data={this.props.data}
            color={this.props.color}
            hideTicks={this.props.hideTicks}
            hideLabel={this.props.hideLabel}
            showAxes={this.props.showAxes}
            spacing={this.props.spacing}
            numLabelSize={this.props.numLabelSize}
          />
        )
    }
  }
  render() {
    return (
      <div className="graph">
        <h1 className="title">
          {this.props.title}
        </h1>
        <div>
          {this.chooseGraph()}
        </div>
        {this.props.alertMsg &&
          <Alert
            className="alert"
            status={this.props.alert}
            statusString={this.props.alertMsg}
          />}
      </div>
    )
  }
}

ChartComponent.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  color: PropTypes.arrayOf(PropTypes.string),
  type: PropTypes.string.isRequired,
  title: PropTypes.string,
  alert: PropTypes.string,
  alertMsg: PropTypes.string,
  hideLabel: PropTypes.bool,
  hideTicks: PropTypes.bool,
  showAxes: PropTypes.bool,
  rightLabel: PropTypes.bool,
  spacing: PropTypes.number,
  numLabelSize: PropTypes.number,
}

ChartComponent.defaultProps = {
  hideLabel: true,
  hideTicks: true,
  showAxes: true,
  rightLabel: false,
  color: [],
  title: '',
  alertMsg: '',
  alert: '',
  spacing: 0.4,
  numLabelSize: 18,
}

/* const enhance = compose(
  setPropTypes({
    data: PropTypes.isRequired,
    color: PropTypes,
    type: PropTypes.string.isRequired,
    title: PropTypes.string,
    alert: PropTypes.string,
    alertMsg: PropTypes.string,
    hideLabel: PropTypes.boolean,
    hideTicks: PropTypes.boolean,
    showAxes: PropTypes.boolean,
    rightLabel: PropTypes.boolean,
  }),
  pure
)*/

export default ChartComponent
