import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'

import { compose, pure, withProps, withStateHandlers } from 'recompose'
import { Card } from 'react-toolbox/lib/card'
import { Unit } from '../../components/pureGrids'
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

const mockActionSummaryMap = {
  Device: {
    titleI18nKey: 'issueCategoryDeviceHealth',
    items: [
      {
        site: 'Someville',
        status: 'Active',
        issue: 'Machine Temperature',
      },
      {
        site: 'Someville',
        status: 'Acknowledged',
        issue: 'Machine Temperature',
        acknowledgedOn: new Date(),
      },
    ],
  },
  Reagent: {
    titleI18nKey: 'issueCategoryReagentHealth',
    items: [],
  },
  Data: {
    titleI18nKey: 'issueCategoryDataHealth',
    items: [
      {
        site: 'Taunggyi, SHN #2',
        status: 'Acknowledged',
        issue: 'Machine Temperature',
        acknowledgedOn: new Date(),
      },
    ],
  },
  Connectivity: {
    titleI18nKey: 'issueCategoryConnectivityHealth',
    items: [
      {
        site: 'Tachileik, SHN #1',
        status: 'Active',
        issue: 'Machine Temperature',
      },
      {
        site: 'Tachileik, SHN #1',
        status: 'Active',
        issue: 'Machine Temperature',
      },
      {
        site: 'Tachileik, SHN #1',
        status: 'Active',
        issue: 'Machine Temperature',
      },
      {
        site: 'Someville',
        status: 'Acknowledged',
        issue: 'Machine Temperature',
        acknowledgedOn: new Date(),
      },
    ],
  },
}

const enhance = compose(
  pure,
  withProps(() => ({
    actionSummaryMap: Immutable.fromJS(mockActionSummaryMap),
  })),
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
              messages[actionSummaryMap.getIn([category, 'titleI18nKey'])]
            )}
            category={category}
            data-value={category}
            actions={actionSummaryMap.getIn([category, 'items'])}
            onClick={onCategoryClick}
          />
        </Unit>
      ))}
    </div>
    <div>
      {!actionSummaryMap.getIn([selectedCategory, 'items']).isEmpty() && (
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
            .getIn([selectedCategory, 'items'])
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
