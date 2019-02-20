import PropTypes from 'prop-types'
import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers, lifecycle, setPropTypes } from 'recompose'
import { defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import Helmet from 'react-helmet'
import Card from '@material-ui/core/Card'
import FaArrowUp from 'react-icons/lib/fa/arrow-up'
import { fetchTask } from '../TaskRedux'

// import ButtonGroup from '../../components/themedReactToolbox/ButtonGroup'
import DetailBackBar from '../../globals/components/DetailBackBar'
import { Unit } from '../../components/pureGrids'
import AlertType from '../../components/shared/AlertType'

const cssClasses = classnames.bind(require('./TaskDetail.css'))

const messages = defineMessages({
  taskDetailTitle: {
    id: 'pages.TaskDetail.title',
    defaultMessage: 'Task',
  },
})

const enhance = compose(
  setPropTypes({
    match: PropTypes.shape({
      params: PropTypes.shape({
        taskId: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }),
  connect(
    state => ({
      task: state.task.taskDetails,
      jobPersons: state.task.jobPersons,
    }),
    bindActionCreators.bind(null, { fetchTask })
  ),
  withHandlers({
    onInitialLoad: ({ match, fetchTask }) => () => {
      fetchTask(match.params.taskId)
    },
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

export const TaskDetail = ({
  intl,
  history,
  location,
  match,
  task,
  jobPersons,
  // --- injected by recompose ---
  onBackClick,
}) =>
  task && (
    <div>
      <Helmet title={intl.formatMessage(messages.taskDetailTitle)} />
      <DetailBackBar
        history={history}
        location={location}
        match={match}
        onBackClick={onBackClick}
        title={task ? task.get('title') : ''}
      />
      <section className={cssClasses('Section')}>
        <Card className={cssClasses('Card')}>
          <h2 className={cssClasses('Card__Title')}>
            <AlertType alertType="mine" />
            <span className={cssClasses('Card__Title__Text')}>
              {' '}
              {task.get('message')}
            </span>

            {/* <small className={cssClasses('Card__Title__Date')}>by April 10</small>
            <AspectButton
              className={cssClasses('Card__Title__Button')}
              variant="contained"
            >
              Alert settings
            </AspectButton> */}
          </h2>
          <div className={cssClasses('Card__Content')}>
            <Unit lg="1-5">
              <span className={cssClasses('Summary__Item')}>
                {task.get('device')}
                <Link
                  to={`/browse/device/{task.get('device')}`}
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
                {task.get('site')}
                <Link
                  to={`/browse/site${task.get('site')}`}
                  className={cssClasses('Summary__Item__Link')}
                >
                  <FaArrowUp
                    className={cssClasses('Summary__Item__Link__FaArrowUp')}
                  />
                </Link>
              </span>
            </Unit>
            <Unit lg="1-5" />
            <Unit lg="1-5">{intl.formatRelative(task.get('time'))}</Unit>
            <Unit lg="1-5">
              {/* <Link to="/" className={cssClasses('Summary__Item__Link')}>
                <FaBellZ className={cssClasses('Summary__Item__Link__FaBellZ')} />
                Snooze
              </Link> */}
            </Unit>
            <Unit lg="1-5">
              <legend className={cssClasses('Summary__Legend')}>
                People alerted
              </legend>
              <div>
                <span className={cssClasses('Summary__Item')}>
                  {task.get('personName')}
                  <Link to="#" className={cssClasses('Summary__Item__Link')}>
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
                {_.map(jobPersons.toArray(), elem => (
                  <span className={cssClasses('Summary__Item')}>
                    {elem.personName}
                    <Link to="#" className={cssClasses('Summary__Item__Link')}>
                      <FaArrowUp
                        className={cssClasses('Summary__Item__Link__FaArrowUp')}
                      />
                    </Link>
                  </span>
                ))}
              </div>
            </Unit>
            <Unit lg="1-2">
              <legend className={cssClasses('Summary__Legend')}>Status</legend>
              <span className={cssClasses('Summary__Item')}>
                {task.get('issueStatus')}
              </span>
            </Unit>
            {/* <Unit lg="1-2">
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
            </Unit> */}
            {/* <Unit sm="1-1">
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
              <Input
                multiline
                rows={6}
                defaultValue="  "
                className={cssClasses('Input')}
                inputProps={{
                  className: cssClasses('Input__inputElement'),
                }}
              />
            </Unit>
            <Unit sm="1-2">
              <AspectButton variant="contained">Add comment</AspectButton>
            </Unit>          
            <Unit sm="1-2" className={cssClasses('NewMessage__Checkbox')}>
              <CheckboxField checked={false} label="This is now resolved" />
            </Unit> */}
          </div>
        </Card>
      </section>
    </div>
  )

export default enhance(TaskDetail)
