import React from 'react'
import classnames from 'classnames/bind'
import { bindActionCreators } from 'redux'
import { compose, lifecycle, pure } from 'recompose'
import { connect } from 'react-redux'
import { FaChartArea as IconTitle } from 'react-icons/fa'
import Card from '@material-ui/core/Card'

import requirePermissions from '../../../components/shared/requirePermissions'
import { fetchClinicalIndicatorsDashboard } from '../../DashboardRedux'

import Title from '../Title'

const cssClasses = classnames.bind(require('../Status.css'))
const cssClinicalIndicators = classnames.bind(require('./Clinical.css'))

const GraphContainer = ({ title, children, className }) => (
  <div className={cssClinicalIndicators('resultsgraph__container')}>
    <div className={cssClinicalIndicators(className)}>
      <div className={cssClinicalIndicators('results__graph')}>{children}</div>
    </div>
  </div>
)

const enhance = compose(
  pure,
  requirePermissions({
    permissions: [
      'treatmentStatus:admin',
      'treatmentStatus:view',
      'treatmentStatus:edit',
      'result:admin',
      'result:view',
      'result:edit',
    ],
    features: ['summaryDashboard', 'siteDashboard', 'deviceDashboard'],
  }),
  connect(
    (state, props) => {
      const { id } = props.assay
      const clinicalIndicators = state.dashboard.clinicalIndicators.toJS()

      return {
        data: clinicalIndicators[id],
      }
    },
    bindActionCreators.bind(null, {
      fetchClinicalIndicatorsDashboard,
    })
  ),
  lifecycle({
    componentDidMount() {
      const { id: assay, graphType } = this.props.assay
      graphType.map(graph => {
        const { dataKey: type, groupBy, minDate } = graph
        return this.props.fetchClinicalIndicatorsDashboard({
          assay,
          minDate,
          groupBy,
          type,
        })
      })
    },
  })
)

const ClinicalIndicatorsContainer = ({
  className,
  title,
  data = false,
  ...props
}) => {
  const {
    id,
    graphContainerClass,
    colors,
    graphType,
    orderBy,
    assayFromState,
  } = props.assay

  return data && Object.keys(data).length === graphType.length ? (
    <Card className={className}>
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
                resultCategory,
                formatDate = false,
                legend = false,
                averages = false,
                component: Component,
                componentClass,
                displayMethod = 'percentage',
              }) => (
                <Component
                  data={data[dataKey].data}
                  indexBy={indexBy}
                  orderBy={orderBy}
                  resultCategory={resultCategory}
                  legend={legend}
                  averages={averages}
                  formatDate={formatDate}
                  colors={colors}
                  componentClass={componentClass}
                  displayMethod={displayMethod}
                  assayFromState={assayFromState}
                />
              )
            )}
          </GraphContainer>
        </div>
      </div>
    </Card>
  ) : null
}

export default enhance(ClinicalIndicatorsContainer)
