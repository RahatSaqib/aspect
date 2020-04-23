import React, { useState, useEffect } from 'react';
import classnames from 'classnames/bind';
import { bindActionCreators } from 'redux';
import { compose, lifecycle, pure } from 'recompose';
import { connect } from 'react-redux';
import { FaChartArea as IconTitle } from 'react-icons/fa';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';

import requirePermissions from '../../../components/shared/requirePermissions';
import { fetchClinicalIndicatorsDashboard } from '../../DashboardRedux';
import { getDayFromToday } from './Graphs/Helpers';

import Title from '../Title';

const cssClasses = classnames.bind(require('../Status.css'));
const cssClinicalIndicators = classnames.bind(require('./Clinical.css'));

const GraphContainer = ({ title, children, className }) => (
  <div className={cssClinicalIndicators('resultsgraph__container')}>
    <div className={cssClinicalIndicators(className)}>
      <div className={cssClinicalIndicators('results__graph')}>{children}</div>
    </div>
  </div>
);

const enhance = compose(
  pure,
  requirePermissions({
    permissions: [
      'treatmentStatus:admin',
      'treatmentStatus:view',
      'treatmentStatus:edit',
      'result:admin',
      'result:view',
      'result:edit'
    ],
    features: ['summaryDashboard', 'siteDashboard', 'deviceDashboard']
  }),
  connect(
    (state, props) => {
      const { stateName = props.assay.id } = props.assay;
      const clinicalIndicators = state.dashboard.clinicalIndicators.toJS();

      return {
        data: clinicalIndicators[stateName]
      };
    },
    bindActionCreators.bind(null, {
      fetchClinicalIndicatorsDashboard
    })
  ),
  lifecycle({
    componentDidMount() {
      const { stateName = assay, id: assay, graphType } = this.props.assay;
      graphType.map(graph =>
        this.props.fetchClinicalIndicatorsDashboard({
          stateName,
          maxDate: getDayFromToday(0),
          assay,
          ...graph
        })
      );
    }
  })
);

const ClinicalIndicatorsContainer = ({
  className,
  title,
  data = false,
  ...props
}) => {
  const { assay, intl } = props;
  const {
    graphContainerClass,
    colors,
    graphType,
    orderBy,
    assayFromState,
    sectionGrid = 12
  } = assay;
  const [graphData, setGraphData] = useState(false);

  useEffect(() => {
    if (graphData !== data) {
      setGraphData(data);
    }
  }, [data, graphData]);

  return graphData ? (
    <Grid
      item
      lg={sectionGrid}
      className={cssClinicalIndicators(
        sectionGrid === 6 ? 'Grid__Item--half' : 'Grid__Item'
      )}
    >
      <Card className={className} style={{ margin: '0 3px' }}>
        <div
          className={cssClasses('TitleContainer', 'Treatment--TitleContainer')}
        >
          <Title
            title={title}
            icon={<IconTitle className={cssClasses('Title__Icon')} />}
          />
        </div>

        <div style={{ marginTop: 30 }}>
          <div className={cssClinicalIndicators('results__container')}>
            <GraphContainer
              className={cssClinicalIndicators(graphContainerClass)}
            >
              {graphType.map(
                ({
                  dataKey,
                  indexBy,
                  keyToConsume,
                  formatDate = false,
                  legend = false,
                  averages = false,
                  component: Component,
                  componentClass,
                  displayMethod = 'percentage',
                  filter = false
                }) => {
                  return (
                    <Component
                      data={(data[dataKey] && data[dataKey].data) || []}
                      indexBy={indexBy}
                      orderBy={orderBy}
                      keyToConsume={keyToConsume}
                      legend={legend}
                      averages={averages}
                      formatDate={formatDate}
                      colors={colors}
                      componentClass={componentClass}
                      displayMethod={displayMethod}
                      assayFromState={assayFromState}
                      filter={filter}
                      intl={intl}
                    />
                  );
                }
              )}
            </GraphContainer>
          </div>
        </div>
      </Card>
    </Grid>
  ) : null;
};

export default enhance(ClinicalIndicatorsContainer);
