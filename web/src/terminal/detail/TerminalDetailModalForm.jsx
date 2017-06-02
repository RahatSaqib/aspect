// Imports from packages
import classnames from 'classnames/bind'
import _ from 'lodash'
import _fp from 'lodash/fp'
import PropTypes from 'prop-types'
import React from 'react'
import { compose, setPropTypes, withHandlers, lifecycle, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

// Material-UI
import FlatButton from 'material-ui/FlatButton'
import TextField from 'material-ui/TextField'
import Checkbox from 'material-ui/Checkbox'
import AutoComplete from 'material-ui/AutoComplete'
import ExitToApp from 'material-ui/svg-icons/action/exit-to-app'
import Dialog from 'material-ui/Dialog'

// Our own imports
import recomposeForm from '../../components/recomposeForm'
import JSONSchemaCard from '../../components/shared/JSONSchemaCard'
import { tokens } from '../../deviceStatus/DeviceStatusRedux'
import { fetchSites } from '../../site/SiteRedux'
import styles from './TerminalDetailModalForm.css'

const cssClasses = classnames.bind(styles)

const enhance = compose(
  pure,
  setPropTypes({
    onCancel: PropTypes.func,
    formatNestedSubtitle: PropTypes.func.isRequired,
    configurationDataSchema: PropTypes.object.isRequired,
    isDialogOpen: PropTypes.bool.isRequired,
    values: PropTypes.object.isRequired,
  }),
  recomposeForm({
    fields: [
      'name',
      'shortname',
      'notes',
      {
        fieldName: 'statusToken',
        valueFromChangeEvent(e, isInputChecked) {
          return isInputChecked ? tokens.APPROVED : tokens.ASSIGNED
        },
      },
      {
        fieldName: 'siteId',
        valueFromChangeEvent: _fp.identity,
      },
      {
        fieldName: 'configurationData',
        valueFromChangeEvent: _fp.identity,
      },
    ],
    validate(values) {
      const errors = {}
      //
      if (!values.name) {
        errors.name = 'Required'
      }
      if (!values.siteId) {
        errors.siteId = 'Required'
      }
      return errors
    },
  }),
  connect(
    state => {
      const siteList = state.site.items.byId
        .valueSeq()
        .map(item => ({ value: item.get('id'), text: item.get('name') }))
        .toJS()

      return {
        siteList,
      }
    },
    bindActionCreators.bind(null, {
      fetchSites,
    })
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchSites({}, undefined, undefined, 0, 99999)
    },
  }),
  withHandlers({
    onSiteAutoCompleteNewRequest: props => (chosenRequest, index) => {
      if (index === -1) {
        // if user typed text and pressed Enter, then index=-1 - and
        // chosenRequest is string value (see API doc - http://www.material-ui.com/#/components/auto-complete)
        const textLo = chosenRequest.toLowerCase().trim()
        const nextSite = _.find(
          props.siteList,
          s => s.text.toLowerCase() === textLo
        )
        if (nextSite) {
          props.onChangeSiteId(nextSite.value)
        }
      } else {
        // if user selected item from the list then index>=0 and
        // chosenRequest is object literal of default format {text:'', value:''}
        props.onChangeSiteId(chosenRequest.value)
      }
    },
    // --------------------------
    // on bluring - check if actual visual site name is correct (exists in datasource)
    // and is equal siteId value stored in props
    // --------------------------
    onSiteAutoCompleteBlur: props => event => {
      const textLo = event.target.value.toLowerCase().trim()
      const nextSite = _.find(
        props.siteList,
        s => s.text.toLowerCase() === textLo
      )

      if (nextSite) {
        // site with this name exists
        if (nextSite.value !== props.values.siteId) {
          // if visual site name differs from currently stored in props - change it
          props.onChangeSiteId(nextSite.value)
        }
      } else {
        // if no site found with this name - empty field
        props.onChangeSiteId(null)
      }
    },
  })
)

export const TerminalDetailModalForm = props => {
  const { form, meta, values, labels } = props

  const site = _.find(props.siteList, s => s.value === values.siteId)

  const actions = [
    props.onCancel &&
      <FlatButton
        onClick={props.onCancel}
        type="button"
        label={labels.cancel}
        primary
        style={{ marginRight: 10 }}
      />,
    <FlatButton
      disabled={form.pristine || !form.valid || form.submitting}
      onClick={props.handleSubmit}
      type="button"
      label={labels.update}
      secondary
    />,
  ]

  return (
    <Dialog
      modal
      actions={actions}
      open={props.isDialogOpen}
      onRequestClose={props.onCancel}
    >
      <form>
        <TextField
          name="Name"
          floatingLabelText={labels.name}
          value={values.name}
          onChange={props.onChangeName}
          fullWidth
          errorText={meta.name.touched && meta.name.error}
        />
        <TextField
          name="Shortname"
          floatingLabelText={labels.shortname}
          value={values.shortname}
          onChange={props.onChangeShortname}
          fullWidth
          errorText={meta.shortname.touched && meta.shortname.error}
        />
        <TextField
          name="Notes"
          floatingLabelText={labels.notes}
          value={values.notes}
          onChange={props.onChangeNotes}
          fullWidth
          errorText={meta.notes.touched && meta.notes.error}
        />
        <Checkbox
          name="Status"
          label={labels.statusToken}
          style={{ padding: '10px 0' }}
          checked={values.statusToken === tokens.APPROVED}
          onCheck={props.onChangeStatusToken}
        />
        <div className={cssClasses('AutoCompleteField')}>
          <div className={cssClasses('AutoCompleteField__Inner')}>
            <AutoComplete
              className={cssClasses('AutoCompleteField__Inner__AutoComplete')}
              name="SiteId"
              floatingLabelText={labels.siteId}
              hintText="Enter site name"
              dataSource={props.siteList}
              filter={AutoComplete.caseInsensitiveFilter}
              searchText={_.get(site, 'text')}
              onNewRequest={props.onSiteAutoCompleteNewRequest}
              onBlur={props.onSiteAutoCompleteBlur}
              fullWidth
              errorText={meta.siteId.touched && meta.siteId.error}
            />
            <Link
              className={cssClasses('AutoCompleteField__Inner__Link')}
              title="Go to site"
              to={`/site/${values.siteId}`}
            >
              <ExitToApp />
            </Link>
          </div>
        </div>
        <JSONSchemaCard
          initiallyExpanded
          title={labels.configuration}
          renderField={field => (
            <TextField
              name={field.key}
              floatingLabelText={field.label}
              value={field.value}
              onTouchTap={stopEventPropagation}
              onChange={event =>
                props.onChangeConfigurationData(
                  values.configurationData.setIn(field.path, event.target.value)
                )}
              fullWidth
            />
          )}
          formatNestedSubtitle={props.formatNestedSubtitle}
          dataSchema={props.configurationDataSchema}
          data={values.configurationData}
        />
      </form>
    </Dialog>
  )
}

function stopEventPropagation(event) {
  event.stopPropagation()
}

export const TerminalDetailModalFormContainer = enhance(TerminalDetailModalForm)

export default TerminalDetailModalFormContainer
