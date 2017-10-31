import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import FaExclamationTriangle from 'react-icons/lib/fa/exclamation-triangle'
import FaCircle from 'react-icons/lib/fa/circle'

import AbnormalBarGraph from '../../components/graph/AbnormalBarGraph'

const cssClasses = classnames.bind(require('./OperationalData.css'))

const enhance = _.identity

const AbnormalBarChart = ({ component, item, ...restProps }) =>
  React.createElement(
    component,
    {
      ...restProps,
      className: cssClasses(restProps.className, 'AbnormalBarChart'),
    },
    <AbnormalBarGraph
      average={item.get('averageValue')}
      data={item.get('data').toJS()}
      x={it => it.id}
      y={it => it.value}
      yDomainMax={30}
      fill={it => (it.abnormal ? '#EA4E62' : '#36DED6')}
    />,
    <div className={cssClasses('AbnormalBarChart__Title')}>
      {item.get('title')}
    </div>,
    <div className={cssClasses('AbnormalBarChart__Message')}>
      {item.get('isNormal') ? (
        <FaCircle
          className={cssClasses('AbnormalBarChart__Message__Icon--normal')}
        />
      ) : (
        <FaExclamationTriangle
          className={cssClasses('AbnormalBarChart__Message__Icon--abnormal')}
        />
      )}
      <span className={cssClasses('AbnormalBarChart__Message__Text')}>
        {item.get('message')}
      </span>
    </div>
  )

export default enhance(AbnormalBarChart)
