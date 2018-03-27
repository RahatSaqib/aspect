import classnames from 'classnames/bind'
import Immutable from 'immutable'
import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import {
  compose,
  lifecycle,
  pure,
  withHandlers,
  withStateHandlers,
} from 'recompose'

import { Card } from 'react-toolbox/lib/card'
import { Unit } from '../../components/pureGrids'
import { fetchActionDashboard } from '../DashboardRedux'
import Title from './Title'
import ActionFilterButton from './ActionFilterButton'
import { findKeyInTree } from '../../shared/utils/dom'
import {
  ActionDataTable,
  ActionDataTableHead,
  ActionDataTableRow,
} from './list/ActionDataTable'

import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const EMPTY_LIST = Immutable.List()

const enhance = compose(
  pure,
  connect(
    state => ({
      actionSummaryMap: state.dashboard.actionSummaryMap,
    }),
    bindActionCreators.bind(null, {
      fetchActionDashboard,
    })
  ),
  withHandlers({
    onInitialLoad: ({ location, fetchActionDashboard }) => () => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(
        searchParams.get('filters') || ''
      )

      fetchActionDashboard(filtersParams)
    },
  }),
  lifecycle({
    componentDidMount() {
      this.props.onInitialLoad()
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  }),
  withStateHandlers(
    () => ({
      selectedCategory: 'Device',
    }),
    {
      onCategoryClick: () => ({ target }) => ({
        selectedCategory: findKeyInTree(target, 'value'),
      }),
    }
  )
)

export const ActionStatus = ({
  intl,
  history,
  className,
  title,
  // --- injected by recompose ---
  actionSummaryMap,
  selectedCategory,
  onCategoryClick,
}) => (
  <Card className={className}>
    <Title colorClassName={cssClasses('Title__Color--site')} title={title} />
    <div className={cssClasses('ActionFilter')}>
      {['Device', 'Reagent', 'Connectivity', 'Data'].map(category => (
        <Unit sm="1-2" lg="1-4">
          <ActionFilterButton
            intl={intl}
            selected={selectedCategory === category}
            title={intl.formatMessage(
              messages[`issueCategory${category}Health`]
            )}
            category={category}
            data-value={category}
            actions={actionSummaryMap.get(category, EMPTY_LIST)}
            onClick={onCategoryClick}
          />
        </Unit>
      ))}
    </div>
    <div>
      {actionSummaryMap.get(selectedCategory) && (
        <ActionDataTable
          selectable={false}
          className={cssClasses('ActionDataTable')}
        >
          <ActionDataTableHead
            history={history}
            columns={[
              {
                key: 'status',
                label: intl.formatMessage(messages.actionStatus),
                className: cssClasses('ActionDataTable__TableHead__Status'),
              },
              {
                key: 'site',
                label: intl.formatMessage(messages.actionLab),
              },
              {
                key: 'issue',
                label: intl.formatMessage(messages.actionIssue),
              },
              {
                key: 'status',
              },
              {
                key: 'link',
              },
            ]}
          />
          {actionSummaryMap
            .get(selectedCategory)
            .map(action => (
              <ActionDataTableRow
                key={action.get('id')}
                intl={intl}
                messages={messages}
                action={action}
                data-action-Id={action.get('id')}
              />
            ))}
        </ActionDataTable>
      )}
    </div>
  </Card>
)

export default enhance(ActionStatus)
