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
import { Card } from 'react-toolbox/lib/card'

import { Unit } from '../../components/pureGrids'
import { fetchActionDashboard } from '../DashboardRedux'
import Title from './Title'
import Icon from '../../components/shared/icon/Icon'
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
  availableSortCol: ['status', 'siteName', 'message'],
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
    onActionListClick: ({ history }) => event => {
      event.stopPropagation()
      const {
        currentTarget: { dataset: { siteId, deviceId, resultId } },
      } = event
      if (resultId) {
        history.push(`/browse/result/${resultId}`)
      } else if (deviceId) {
        history.push(`/browse/device/${deviceId}`)
      } else if (siteId) {
        history.push(`/browse/site/${siteId}`)
      }
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
      selectedCategory: 'DeviceHealth',
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
  onActionListClick,
}) => (
  <Card className={className}>
    <div className={cssClasses('TitleContainer')}>
      <Title
        title={title}
        icon={
          <Icon
            className={cssClasses('Title__Icon')}
            type={require('../../components/shared/icon/assets/action.svg')}
          />
        }
      />
    </div>

    <div className={cssClasses('ActionFilter')}>
      {[
        'DeviceHealth',
        'ReagentHealth',
        'ConnectivityHealth',
        'DataHealth',
      ].map(category => (
        <Unit xs="1-4" sm="1-4">
          <ActionFilterButton
            intl={intl}
            selected={selectedCategory === category}
            title={intl.formatMessage(messages[`issueCategory${category}`])}
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
              key: 'siteName',
              label: intl.formatMessage(messages.actionLab),
              className: cssClasses('ActionDataTable__TableHead__Lab'),
              sortable: true,
            },
            {
              key: 'message',
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
              onActionListClick={onActionListClick}
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
