// Imports from packages
import classnames from 'classnames/bind'
import _ from 'lodash'
import _fp from 'lodash/fp'
import React, { PureComponent, PropTypes } from 'react'
import { compose, defaultProps, withHandlers, lifecycle, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from 'react-router'

// Material-UI
import LinearProgress from 'material-ui/LinearProgress'
import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'
import AutoComplete from 'material-ui/AutoComplete'
import ExitToApp from 'material-ui/svg-icons/action/exit-to-app'

// Our own imports
import recomposeForm from '../../components/recomposeForm'
import { fetchSites } from '../../site/SiteRedux'
import styles from './DeviceDetailForm.css'
const cssClasses = classnames.bind(styles)

const enhance = compose(
  recomposeForm({
    fields: ['name', 'shortname', 'notes', {
      fieldName: 'siteId',
      valueFromChangeEvent: _fp.identity
    }],
    validate: values => {
      const errors = {}
      //
      if (!values.name) {
        errors.name = 'Required'
      }
      if (!values.shortname) {
        errors.shortname = 'Required'
      }
      if (!values.siteId) {
        errors.siteId = 'Required'
      }
      return errors
    }
  }),
  connect(state => {
    const siteList = state.site.items.byId.valueSeq().map(item => ({ value:item.get('id'), text:item.get('name') }) ).toJS()

    return {
      siteList
    }
  }, bindActionCreators.bind(null, {
    fetchSites
  })),
  lifecycle({
    componentDidMount() {
      this.props.fetchSites({}, undefined, undefined, 0, 99999)
    }
  }),
  withHandlers({
    onSiteAutoCompleteNewRequest: props => (chosenRequest, index) => {
      // if user typed text and pressed Enter, then index=-1 - and chosenRequest is string value (see API doc - http://www.material-ui.com/#/components/auto-complete)
      if (index === -1){
        const textLo = chosenRequest.toLowerCase().trim()
        const nextSite = _.find(props.siteList, s => s.text.toLowerCase() === textLo)
        if (nextSite){
          props.onChangeSiteId(nextSite.value)
        }
      }
      // if user selected item from the list then index>=0 and chosenRequest is object literal of default format {text:'', value:''}
      else {
        props.onChangeSiteId(chosenRequest.value)
      }
    },
    // --------------------------
    // on bluring - check if actual visual site name is correct (exists in datasource) and is equal siteId value stored in props
    // --------------------------
    onSiteAutoCompleteBlur: props => event => {
      const textLo = event.target.value.toLowerCase().trim()
      const nextSite = _.find(props.siteList, s => s.text.toLowerCase() === textLo)

      // site with this name exists
      if (nextSite){
        // if visual site name differs from currently stored in props - change it
        if (nextSite.value !== props.values.siteId){
          props.onChangeSiteId(nextSite.value)
        }
      }
      // if no site found with this name - empty field
      else {
        props.onChangeSiteId(null)
      }
    }
  }),
  pure
)

export const DeviceDetailForm = (props) => {
  const { form, meta, values, labels } = props

  const site = _.find(props.siteList, s => s.value === values.siteId)

  return (
    <form>
      <div>
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
      </div>
      <div>
        <RaisedButton
          disabled={form.pristine || !form.valid || form.submitting}
          onClick={props.handleSubmit}
          type="button"
          label="Update"
          secondary
        />
      </div>
    </form>
  )
}

export const DeviceDetailFormContainer = enhance(DeviceDetailForm)

export default DeviceDetailFormContainer
