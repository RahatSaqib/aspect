import map from 'lodash/map'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, lifecycle } from 'recompose'
import { defineMessages } from 'react-intl'
import { connect } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import Card from '@mui/material/Card'
import { FaArrowUp } from 'react-icons/fa'
import { fetchTask } from '../../../store/TaskRedux'

// import ButtonGroup from '../../components/themedReactToolbox/ButtonGroup'
import DetailBackBar from '../../../oldComponents/DetailBackBar'
import { Unit } from '../../../oldComponents/pureGrids'
import AlertType from '../../../oldComponents/shared/AlertType'
import { formatRelative } from '../../../utils/utils/dateFormat'
import { i18nWrapper } from '../../../providers/I18nProvider/index'

import styles from './TaskDetail.css'

const cssClasses = classnames.bind(styles)

const messages = defineMessages({
  taskDetailTitle: {
    id: 'pages.TaskDetail.title',
    defaultMessage: 'Task',
  },
  taskDetailPeopleAlerted: {
    id: 'pages.TaskDetail.peopleAlerted',
    defaultMessage: 'People alerted',
  },
  taskDetailSiteContact: {
    id: 'pages.TaskDetail.siteContact',
    defaultMessage: 'Site contact',
  },
  taskDetailStatus: {
    id: 'pages.TaskDetail.status',
    defaultMessage: 'Status',
  },
})

const enhance = compose(
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
    return <WrapperComponent {...props} onInitialLoad={() => fetchTask(+taskId)} onBackClick={() => navigate(-1)} />
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
  task,
  jobPersons,
  // --- injected by recompose ---
  onBackClick,
}) => {
  const { formatMessage } = i18nWrapper()
  return (
    task && (
      <div>
        <Helmet title={formatMessage(messages.taskDetailTitle)} />
        <DetailBackBar onBackClick={onBackClick} title={task ? task.get('title') : ''} />
        <section className={cssClasses('Section')}>
          <Card className={cssClasses('Card')}>
            <h2 className={cssClasses('Card__Title')}>
              <AlertType alertType={task.get('issueStatus')} />
              <span className={cssClasses('Card__Title__Text')}> {task.get('message')}</span>
            </h2>
            <div className={cssClasses('Card__Content')}>
              {task.get('device') && (
                <Unit lg="1-5">
                  <span className={cssClasses('Summary__Item')}>
                    {task.get('device')}
                    <Link to={`/browse/device/${task.get('deviceId')}`} className={cssClasses('Summary__Item__Link')}>
                      <FaArrowUp className={cssClasses('Summary__Item__Link__FaArrowUp')} />
                    </Link>
                  </span>
                </Unit>
              )}
              <Unit lg="1-5">
                <span className={cssClasses('Summary__Item')}>
                  {task.get('site')}
                  <Link to={`/browse/site/${task.get('siteId')}`} className={cssClasses('Summary__Item__Link')}>
                    <FaArrowUp className={cssClasses('Summary__Item__Link__FaArrowUp')} />
                  </Link>
                </span>
              </Unit>
              <Unit lg="1-5" />
              <Unit lg="1-5">{formatRelative(task.get('time'))}</Unit>
              <Unit lg="1-5" />
              <br />
              <Unit lg="1-5">
                <legend className={cssClasses('Summary__Legend')}>
                  {formatMessage(messages.taskDetailPeopleAlerted)}
                </legend>
                <div>
                  <span className={cssClasses('Summary__Item')}>
                    {task.get('personName')}
                    <Link to="#" className={cssClasses('Summary__Item__Link')}>
                      <FaArrowUp className={cssClasses('Summary__Item__Link__FaArrowUp')} />
                    </Link>
                  </span>
                </div>
              </Unit>
              <Unit lg="1-5">
                <legend className={cssClasses('Summary__Legend')}>
                  {formatMessage(messages.taskDetailSiteContact)}
                </legend>
                <div>
                  {jobPersons && jobPersons.length > 0
                    ? map(jobPersons.toArray(), elem => (
                        <span className={cssClasses('Summary__Item')}>
                          {elem.personName}
                          <Link to="#" className={cssClasses('Summary__Item__Link')}>
                            <FaArrowUp className={cssClasses('Summary__Item__Link__FaArrowUp')} />
                          </Link>
                        </span>
                      ))
                    : '-'}
                </div>
              </Unit>
              <Unit lg="1-2">
                <legend className={cssClasses('Summary__Legend')}>{formatMessage(messages.taskDetailStatus)}</legend>
                <span className={cssClasses('Summary__Item')}>{task.get('issueStatus')}</span>
              </Unit>
            </div>
          </Card>
        </section>
      </div>
    )
  )
}

export default enhance(TaskDetail)
