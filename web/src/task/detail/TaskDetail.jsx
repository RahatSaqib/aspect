import map from 'lodash/map'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, lifecycle } from 'recompose'
import { defineMessages, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import Card from '@material-ui/core/Card'
import { FaArrowUp } from 'react-icons/fa'
import { fetchTask } from '../TaskRedux'

// import ButtonGroup from '../../components/themedReactToolbox/ButtonGroup'
import DetailBackBar from '../../globals/components/DetailBackBar'
import { Unit } from '../../components/pureGrids'
import AlertType from '../../components/shared/AlertType'
import { formatRelative } from '../../shared/utils/dateFormat'

import styles from './TaskDetail.css'

const cssClasses = classnames.bind(styles)

const messages = defineMessages({
  taskDetailTitle: {
    id: 'pages.TaskDetail.title',
    defaultMessage: 'Task',
  },
})

const enhance = compose(
  injectIntl,
  connect(
    state => ({
      task: state.task.taskDetails,
      jobPersons: state.task.jobPersons,
    }),
    {
      fetchTask,
    }
  ),
  WrapperComponent => props => {
    const { fetchTask, navigate } = props
    const { taskId } = useParams()
    return (
      <WrapperComponent
        {...props}
        onInitialLoad={() => fetchTask(+taskId)}
        onBackClick={() => navigate(-1)}
      />
    )
  },
  lifecycle({
    componentDidMount() {
      this.props.onInitialLoad()
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  })
)

export const TaskDetail = ({
  intl,
  task,
  jobPersons,
  // --- injected by recompose ---
  onBackClick,
}) =>
  task && (
    <div>
      <Helmet title={intl.formatMessage(messages.taskDetailTitle)} />
      <DetailBackBar
        onBackClick={onBackClick}
        title={task ? task.get('title') : ''}
      />
      <section className={cssClasses('Section')}>
        <Card className={cssClasses('Card')}>
          <h2 className={cssClasses('Card__Title')}>
            <AlertType alertType={task.get('issueStatus')} />
            <span className={cssClasses('Card__Title__Text')}>
              {' '}
              {task.get('message')}
            </span>
          </h2>
          <div className={cssClasses('Card__Content')}>
            {task.get('device') && (
              <Unit lg="1-5">
                <span className={cssClasses('Summary__Item')}>
                  {task.get('device')}
                  <Link
                    to={`/browse/device/${task.get('deviceId')}`}
                    className={cssClasses('Summary__Item__Link')}
                  >
                    <FaArrowUp
                      className={cssClasses('Summary__Item__Link__FaArrowUp')}
                    />
                  </Link>
                </span>
              </Unit>
            )}
            <Unit lg="1-5">
              <span className={cssClasses('Summary__Item')}>
                {task.get('site')}
                <Link
                  to={`/browse/site/${task.get('siteId')}`}
                  className={cssClasses('Summary__Item__Link')}
                >
                  <FaArrowUp
                    className={cssClasses('Summary__Item__Link__FaArrowUp')}
                  />
                </Link>
              </span>
            </Unit>
            <Unit lg="1-5" />
            <Unit lg="1-5">{formatRelative(intl, task.get('time'))}</Unit>
            <Unit lg="1-5" />
            <br />
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
                {jobPersons && jobPersons.length > 0
                  ? map(jobPersons.toArray(), elem => (
                      <span className={cssClasses('Summary__Item')}>
                        {elem.personName}
                        <Link
                          to="#"
                          className={cssClasses('Summary__Item__Link')}
                        >
                          <FaArrowUp
                            className={cssClasses(
                              'Summary__Item__Link__FaArrowUp'
                            )}
                          />
                        </Link>
                      </span>
                    ))
                  : '-'}
              </div>
            </Unit>
            <Unit lg="1-2">
              <legend className={cssClasses('Summary__Legend')}>Status</legend>
              <span className={cssClasses('Summary__Item')}>
                {task.get('issueStatus')}
              </span>
            </Unit>
          </div>
        </Card>
      </section>
    </div>
  )

export default enhance(TaskDetail)
