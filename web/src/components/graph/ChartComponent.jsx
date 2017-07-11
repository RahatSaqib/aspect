import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import BarChart from './BarChart'
import ColumnChart from './ColumnChart'
import Alert from './ChartAlert'
import styles from './ChartComponent.css'

const cssClasses = classnames.bind(styles)

class ChartComponent extends Component {
  chooseGraph() {
    switch (this.props.type) {
      case 'column':
        return (
          <ColumnChart
            data={this.props.data}
            color={this.props.color}
            hideTicks={this.props.hideTicks}
            hideLabel={this.props.hideLabel}
            hideAxes={this.props.hideAxes}
            rightLabel={this.props.rightLabel}
            spacing={this.props.spacing}
            numLabelSize={this.props.numLabelSize}
            styleWide={this.props.styleWide}
          />
        )
      case 'bar':
      default:
        return (
          <BarChart
            data={this.props.data}
            color={this.props.color}
            hideTicks={this.props.hideTicks}
            hideLabel={this.props.hideLabel}
            hideAxes={this.props.hideAxes}
            spacing={this.props.spacing}
            numLabelSize={this.props.numLabelSize}
            styleWide={this.props.styleWide}
            xOnly={this.props.xOnly}
          />
        )
    }
  }
  render() {
    return (
      <div className={cssClasses('graph')}>
        <h1 className={cssClasses('title')}>
          {this.props.title}
        </h1>
        <div>
          {this.chooseGraph()}
        </div>
        {this.props.alertMsg &&
          <Alert
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
  hideAxes: PropTypes.bool,
  rightLabel: PropTypes.bool,
  spacing: PropTypes.number,
  numLabelSize: PropTypes.number,
  styleWide: PropTypes.number,
  xOnly: PropTypes.bool,
}

ChartComponent.defaultProps = {
  hideLabel: true,
  hideTicks: true,
  hideAxes: false,
  rightLabel: false,
  color: [],
  title: '',
  alertMsg: '',
  alert: '',
  spacing: 0.4,
  numLabelSize: 18,
  styleWide: false,
  xOnly: false,
}

export default ChartComponent
