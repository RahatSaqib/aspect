import _ from 'lodash'
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
  withProps,
  withStateHandlers,
} from 'recompose'
import MdAssignmentLate from 'react-icons/lib/md/assignment-late'
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
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import { sanitizeFiltersStringBy } from '../../filter/utils'
import requirePermissions from '../../components/shared/requirePermissions'
import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const EMPTY_LIST = Immutable.List()

const FILTERS_CONFIG = {
  siteName: true,
  siteId: true,
}

export const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['status', 'site', 'issue'],
})
export const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
export const filtersFromLocation = composeSanitizer(
  _.flowRight(
    filtersSanitizer,
    searchParams => searchParams.get('filters') || ''
  ),
  searchSanitizer
)

const enhance = compose(
  pure,
  requirePermissions({
    features: ['actionDashboard'],
  }),
  withProps(
    makeSortPageSelector({
      sortCol: 'status',
      sortDir: 'desc',
    })
  ),
  connect(
    state => ({
      actionSummaryMap: state.dashboard.actionSummaryMap,
    }),
    bindActionCreators.bind(null, {
      fetchActionDashboard,
    })
  ),
  withHandlers({
    onInitialLoad: ({
      location,
      sortCol,
      sortDir,
      fetchActionDashboard,
    }) => () => {
      const { value: filtersParams } = filtersFromLocation(location)
      fetchActionDashboard(filtersParams, sortCol, sortDir)
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
  location,
  className,
  title,
  // --- injected by recompose ---
  sortCol,
  sortDir,
  actionSummaryMap,
  selectedCategory,
  onCategoryClick,
}) => (
  <Card className={className}>
    <div className={cssClasses('TitleContainer')}>
      <Title
        title={title}
        icon={<MdAssignmentLate className={cssClasses('Title__Icon')} />}
      />
    </div>

    <div className={cssClasses('ActionFilter')}>
      {['Device', 'Reagent', 'Connectivity', 'Data'].map(category => (
        <Unit xs="1-4" sm="1-4">
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
      <ActionDataTable
        selectable={false}
        className={cssClasses('ActionDataTable')}
      >
        <ActionDataTableHead
          history={history}
          location={location}
          sortColumnKey={sortCol}
          sortColumnDir={sortDir}
          columns={[
            {
              key: 'status',
              label: intl.formatMessage(messages.actionStatus),
              className: cssClasses('ActionDataTable__TableHead__Status'),
              sortable: true,
            },
            {
              key: 'site',
              label: intl.formatMessage(messages.actionLab),
              className: cssClasses('ActionDataTable__TableHead__Lab'),
              sortable: true,
            },
            {
              key: 'issue',
              label: intl.formatMessage(messages.actionIssue),
              className: cssClasses('ActionDataTable__TableHead__Issue'),
              sortable: true,
            },
          ]}
        />
        {actionSummaryMap
          .get(selectedCategory, EMPTY_LIST)
          .map(action => (
            <ActionDataTableRow
              key={action.get('id')}
              intl={intl}
              messages={messages}
              action={action}
              data-action-id={action.get('id')}
            />
          ))}
      </ActionDataTable>
      {!actionSummaryMap.has(selectedCategory) && (
        <div className={cssClasses('ActionDataTable--empty')}>
          <p>{intl.formatMessage(messages.noActionsTitle)}</p>
        </div>
      )}
    </div>
  </Card>
)

export default enhance(ActionStatus)
