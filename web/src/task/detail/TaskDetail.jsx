import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers, lifecycle } from 'recompose'
import { defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import Helmet from 'react-helmet'
import Card from '@material-ui/core/Card'
import { Input } from 'react-toolbox/lib/input'
import { Checkbox } from 'react-toolbox/lib/checkbox'
import FaArrowUp from 'react-icons/lib/fa/arrow-up'

import ButtonGroup from '../../components/themedReactToolbox/ButtonGroup'
import DetailBackBar from '../../globals/components/DetailBackBar'
import { Unit } from '../../components/pureGrids'
import AlertType from '../../components/shared/AlertType'
import FaBellZ from '../../components/shared/FaBellZ'
import AspectButton from '../../components/shared/AspectButton'

const cssClasses = classnames.bind(require('./TaskDetail.css'))

const messages = defineMessages({
  taskDetailTitle: {
    id: 'pages.TaskDetail.title',
    defaultMessage: 'Task',
  },
})

const enhance = compose(
  connect(
    state => ({
      items: state.notification.items,
      table: state.notification.table,
    }),
    bindActionCreators.bind(null, {})
  ),
  withHandlers({
    onInitialLoad: () => () => {},

    onBackClick: ({ history }) => () => {
      history.goBack()
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
  })
)

const INPUT_THEME = {
  inputElement: cssClasses('Input__inputElement'),
}

export const TaskDetail = ({
  intl,
  history,
  location,
  match,
  // --- injected by recompose ---
  onBackClick,
}) => (
  <div>
    <Helmet title={intl.formatMessage(messages.taskDetailTitle)} />
    <DetailBackBar
      history={history}
      location={location}
      match={match}
      onBackClick={onBackClick}
      title="HealthCo HIV Device"
    />
    <section className={cssClasses('Section')}>
      <Card className={cssClasses('Card')}>
        <h2 className={cssClasses('Card__Title')}>
          <AlertType alertType="mine" />
          <span className={cssClasses('Card__Title__Text')}>
            {' '}
            Needs calibrating
          </span>
          <small className={cssClasses('Card__Title__Date')}>by April 10</small>
          <AspectButton
            className={cssClasses('Card__Title__Button')}
            variant="contained"
          >
            Alert settings
          </AspectButton>
        </h2>
        <div className={cssClasses('Card__Content')}>
          <Unit lg="1-5">
            <span className={cssClasses('Summary__Item')}>
              HealthCo HIV Device
              <Link
                to="/browse/device"
                className={cssClasses('Summary__Item__Link')}
              >
                <FaArrowUp
                  className={cssClasses('Summary__Item__Link__FaArrowUp')}
                />
              </Link>
            </span>
          </Unit>
          <Unit lg="1-5">
            <span className={cssClasses('Summary__Item')}>
              Mbarara Lab
              <Link
                to="/browse/site"
                className={cssClasses('Summary__Item__Link')}
              >
                <FaArrowUp
                  className={cssClasses('Summary__Item__Link__FaArrowUp')}
                />
              </Link>
            </span>
          </Unit>
          <Unit lg="1-5" />
          <Unit lg="1-5">March 31, 2017 2:17PM</Unit>
          <Unit lg="1-5">
            <Link to="/" className={cssClasses('Summary__Item__Link')}>
              <FaBellZ className={cssClasses('Summary__Item__Link__FaBellZ')} />
              Snooze
            </Link>
          </Unit>
          <Unit lg="1-5">
            <legend className={cssClasses('Summary__Legend')}>
              People alerted
            </legend>
            <div>
              <span className={cssClasses('Summary__Item')}>
                Mary
                <Link
                  to="/browse/device"
                  className={cssClasses('Summary__Item__Link')}
                >
                  <FaArrowUp
                    className={cssClasses('Summary__Item__Link__FaArrowUp')}
                  />
                </Link>
              </span>
              <span className={cssClasses('Summary__Item')}>
                Abdul
                <Link
                  to="/browse/device"
                  className={cssClasses('Summary__Item__Link')}
                >
                  <FaArrowUp
                    className={cssClasses('Summary__Item__Link__FaArrowUp')}
                  />
                </Link>
              </span>
            </div>
          </Unit>
          <Unit lg="1-5">
            <legend className={cssClasses('Summary__Legend')}>
              Site contact
            </legend>
            <div>
              <span className={cssClasses('Summary__Item')}>
                Dr Doreen Adengo
                <Link
                  to="/browse/site"
                  className={cssClasses('Summary__Item__Link')}
                >
                  <FaArrowUp
                    className={cssClasses('Summary__Item__Link__FaArrowUp')}
                  />
                </Link>
              </span>
            </div>
          </Unit>
          <Unit lg="3-5">
            <legend className={cssClasses('Summary__Legend')}>&nbsp;</legend>
            <div>
              <span className={cssClasses('Summary__Item')}>
                <Link to="/" className={cssClasses('Summary__Item__Link')}>
                  074 2834 8273
                </Link>
              </span>
            </div>
          </Unit>
          <hr />
          <Unit lg="1-2">
            <span className={cssClasses('Summary__Item')}>Status</span>
          </Unit>
          <Unit lg="1-2">
            <ButtonGroup
              isolated
              className={cssClasses('Card__Content__StatusButtonGroup')}
            >
              <AspectButton
                color="primary"
                variant="contained"
                inverse
                className={cssClasses('Button--inverse')}
              >
                Alerted
              </AspectButton>
              <AspectButton color="primary" variant="contained">
                In progress
              </AspectButton>
              <AspectButton
                color="primary"
                variant="contained"
                inverse
                className={cssClasses('Button--inverse')}
              >
                Resolved
              </AspectButton>
            </ButtonGroup>
          </Unit>
          <Unit sm="1-1">
            <ol className={cssClasses('MessageList')}>
              {_.map(
                [
                  {
                    id: 1,
                    author: 'Mary',
                    date: 'March 31, 2017 2:17PM',
                    text: '@Abdul can you please investigate?',
                  },
                  {
                    id: 2,
                    author: 'Abdul',
                    date: 'March 31, 2017 2:17PM',
                    text:
                      'I called the lab and they said that they will do the calibration tomorrow.',
                  },
                ],
                message => (
                  <li
                    key={message.id}
                    className={cssClasses('MessageList__Item')}
                  >
                    <div className={cssClasses('MessageList__Item__Text')}>
                      {message.text}
                    </div>
                    <div>
                      <span className={cssClasses('MessageList__Item__Author')}>
                        {message.author}
                      </span>
                      <span className={cssClasses('MessageList__Item__Date')}>
                        {message.date}
                      </span>
                    </div>
                  </li>
                )
              )}
            </ol>
          </Unit>
          <Unit sm="1-1">
            <Input theme={INPUT_THEME} multiline rows={6} defaultValue="  " />
          </Unit>
          <Unit sm="1-2">
            <AspectButton variant="contained">Add comment</AspectButton>
          </Unit>
          <Unit sm="1-2">
            <Checkbox
              className={cssClasses('NewMessage__Checkbox')}
              checked={false}
              label="This is now resolved"
            />
          </Unit>
        </div>
      </Card>
    </section>
  </div>
)

export default enhance(TaskDetail)
