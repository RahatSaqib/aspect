import React from 'react';
import Paper from 'material-ui/Paper';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';

require('./../../styles/Charts.css');

class MiniChart extends React.Component {

  constructor(props) {
    super(props);
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
            <span>{this.props.number.toLocaleString()}</span>
        </div>
        <div className="clear-fix" ></div>
      </Paper>
      );
  }
}

MiniChart.propTypes = {
  bgcolor: React.PropTypes.string.isRequired,
  data: React.PropTypes.array.isRequired,
  label: React.PropTypes.string.isRequired,
  number: React.PropTypes.any.isRequired
};

export default MiniChart;
