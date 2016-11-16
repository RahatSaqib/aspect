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
import { withFormField, withFormSubmit } from '../../components/recomposeForms'
import { fetchSites } from '../../site/SiteRedux'
import styles from './DeviceDetailForm.css'
const cssClasses = classnames.bind(styles)

const enhance = compose(
  defaultProps({
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
  withFormField('name'),
  withFormField('shortname'),
  withFormField('notes'),
  withFormField('siteId', _fp.identity),
  withFormSubmit(['name', 'shortname', 'siteId']),
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
        if (nextSite.value !== props.siteId.value){
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
  const { pristine, valid, name, shortname, notes, siteId } = props

  const site = _.find(props.siteList, s => s.value === siteId.value)

  return (
    <form>
      <div>
        <TextField
          name="__Name"
          floatingLabelText="++Name"
          value={name.value}
          onChange={props.onChangeName}
          fullWidth
          errorText={name.meta.touched && name.meta.error}
        />
        <TextField
          name="__Shortname"
          floatingLabelText="++Shortname"
          value={shortname.value}
          onChange={props.onChangeShortname}
          fullWidth
          errorText={shortname.meta.touched && shortname.meta.error}
        />
        <TextField
          name="__Notes"
          floatingLabelText="++Notes"
          value={notes.value}
          onChange={props.onChangeNotes}
          fullWidth
          errorText={notes.meta.touched && notes.meta.error}
        />
        <div className={cssClasses('AutoCompleteField')}>
          <div className={cssClasses('AutoCompleteField__Inner')}>
            <AutoComplete
              className={cssClasses('AutoCompleteField__Inner__AutoComplete')}
              name="__SiteId"
              floatingLabelText="++Site"
              hintText="Enter site name"
              dataSource={props.siteList}
              filter={AutoComplete.caseInsensitiveFilter}
              searchText={_.get(site, 'text')}
              onNewRequest={props.onSiteAutoCompleteNewRequest}
              onBlur={props.onSiteAutoCompleteBlur}
              fullWidth
              errorText={siteId.meta.touched && siteId.meta.error}
            />
            <Link
              className={cssClasses('AutoCompleteField__Inner__Link')}
              title="Go to site"
              to={`/site/${siteId.value}`}
            >
              <ExitToApp />
            </Link>
          </div>
        </div>
      </div>
      <div>
        <RaisedButton
          disabled={pristine || !valid}
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
