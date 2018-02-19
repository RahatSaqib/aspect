import _ from 'lodash'
import React from 'react'
import LinearProgress from 'material-ui/LinearProgress'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { compose, withHandlers, lifecycle, withProps } from 'recompose'

import { fetchResultLog } from '../ResultRedux'
import RawData from './RawData'

const enhance = compose(
  connect(
    state => ({ loading: state.result.loading }),
    bindActionCreators.bind(null, {
      fetchResultLog,
    })
  ),
  withHandlers({
    onInitialLoad: ({ fetchResultLog, match }) => () => {
      fetchResultLog(match.params.resultId)
    },
  }),
  lifecycle({
    componentDidMount() {
      this.props.onInitialLoad()
    },
  }),
  withProps(({ handleToggle }) => ({
    dialogActions: [
      <FlatButton label="Close" primary onClick={handleToggle} />,
    ],
  }))
)

export const RawDataDialog = ({
  createdOnLabel,
  formatMessage,
  handleToggle,
  isShown,
  logs,
  // injected by recompose
  dialogActions,
  loading,
}) => (
  <div>
    <Dialog
      actions={dialogActions}
      open={isShown}
      onRequestClose={handleToggle}
      title="Raw Result Data"
      autoScrollBodyContent
    >
      {_.isEmpty(logs) && loading ? (
        <LinearProgress />
      ) : _.isEmpty(logs) ? (
        <div style={{ paddingTop: '10px' }}>
          No log entries found for this result
        </div>
      ) : (
        logs.map((log, index) => {
          const createdOn = new Date(log.createdOn)
          const rawMessage = JSON.parse(log.rawMessage)
          return (
            <RawData
              createdOn={createdOn}
              createdOnLabel={createdOnLabel}
              formatMessage={formatMessage}
              index={index}
              rawMessage={rawMessage}
            />
          )
        })
      )}
    </Dialog>
  </div>
)

export default enhance(RawDataDialog)
