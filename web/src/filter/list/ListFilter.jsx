// Imports from packages
import _ from 'lodash'
import Immutable from 'immutable'
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import {Card, CardActions, CardText} from 'material-ui/Card'
import Toggle from 'material-ui/Toggle'
import FlatButton from 'material-ui/FlatButton'
import TextField from 'material-ui/TextField'

// Our own imports
import CountrySelectField from '../geography/CountrySelectField'
import StateSelectField from '../geography/StateSelectField'
import LgaSelectField from '../geography/LgaSelectField'
import AssaySelectField from '../resource/AssaySelectField'
import ResultCategorySelectField from '../resource/ResultCategorySelectField'
import DateRangeSelector from '../date/DateRangeSelector'
import {
  clearListFilter,
  changeListFilter
} from '../FilterRedux'
import styles from './ListFilter.css'

export class ListFilter extends PureComponent {

  static propTypes = {
    onClearFilter: PropTypes.func.isRequired, // connect
    onChangeFilter: PropTypes.func.isRequired, // connect
    filter: PropTypes.shape({
      assayId: PropTypes.string,
      countryId: PropTypes.string,
      stateId: PropTypes.string,
      lgaId: PropTypes.string,
      minDate: PropTypes.string,
      maxDate: PropTypes.string,
      deviceName: PropTypes.string,
      resultCategoryId: PropTypes.string,
      siteName: PropTypes.string,
      contactNameOrEmail: PropTypes.string
    }).isRequired, // connect
    defaultExpanded: PropTypes.bool,
    config: PropTypes.shape({
      assayAndResultCategory: PropTypes.bool,
      geography: PropTypes.bool, // country, state, lga
      date: PropTypes.bool,
      deviceName: PropTypes.bool,
      siteName: PropTypes.bool,
      contactNameOrEmail: PropTypes.bool
    }).isRequired
  }

  state = {
    expanded: !!this.props.defaultExpanded
  }

  handleExpandChange = (expanded) => {
    this.setState({ expanded })
  }

  handleToggle = (event, toggle) => {
    this.setState({ expanded: toggle })
  }

  handleAssayIdChange = (assayId) => {
    const nextFilter = {
      ...this.props.filter,
      assayId
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleChangeDate = (name, date) => {
    const nextFilter = {
      ...this.props.filter,
      [name]: date
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleChangeCountry = (countryId) => {
    const nextFilter = {
      ...this.props.filter,
      countryId,
      stateId: undefined,
      lgaId: undefined
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleChangeState = (stateId) => {
    const nextFilter = {
      ...this.props.filter,
      stateId,
      lgaId: undefined
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleChangeLga = (lgaId) => {
    const nextFilter = {
      ...this.props.filter,
      lgaId
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleResultCategoryChange = (resultCategoryId) => {
    const nextFilter = {
      ...this.props.filter,
      resultCategoryId
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleTextFieldChange = (event) => {
    const nextFilter = {
      ...this.props.filter,
      [event.target.name]: event.target.value
    }
    this.props.onChangeFilter(nextFilter)
  }

  render() {
    const { filter, config } = this.props
    const { expanded } = this.state
    const filterMessage = `\`${JSON.stringify(filter)}\``
    const hasDataSection = (
      config.assay || config.deviceName || config.result ||
      config.siteName || config.contactNameOrEmail
    )

    return (
      <div>
        <Card expanded={expanded} onExpandChange={this.handleExpandChange}>
          <CardText>
            <div className={styles.Header}>
              <div className={styles.Header__Message}>{filterMessage}</div>
              <div className={styles.Header__Toggle}>
                <Toggle
                  toggled={expanded}
                  onToggle={this.handleToggle}
                />
              </div>
            </div>
          </CardText>
          <CardText expandable>
            {config.date && (
              <section className={styles.Section}>
                <h3 className={styles.Section__Title}>Date Range</h3>
                <div className={styles.Section__Content}>
                  <DateRangeSelector
                    clearButtonTooltip="Clear"
                    clearButtonStyle={{verticalAlign: 'bottom'}}
                    onChangeDate={this.handleChangeDate}
                    minDate={filter.minDate}
                    maxDate={filter.maxDate}
                    autoOk
                  />
                </div>
              </section>
            )}
            {config.geography && (
              <section className={styles.Section}>
                <h3 className={styles.Section__Title}>Location</h3>
                <div className={styles.Section__Content}>
                  <CountrySelectField
                    onChangeCountry={this.handleChangeCountry}
                    countryId={this.props.filter.countryId}
                    floatingLabelText="Country"
                    style={{verticalAlign: 'bottom'}}
                  />
                  <StateSelectField
                    onChangeState={this.handleChangeState}
                    countryId={this.props.filter.countryId}
                    stateId={this.props.filter.stateId}
                    floatingLabelText="State"
                    style={{verticalAlign: 'bottom'}}
                  />
                  <LgaSelectField
                    onChangeLga={this.handleChangeLga}
                    countryId={this.props.filter.countryId}
                    stateId={this.props.filter.stateId}
                    lgaId={this.props.filter.lgaId}
                    floatingLabelText="Area"
                    style={{verticalAlign: 'bottom'}}
                  />
                </div>
              </section>
            )}
            {hasDataSection && (
              <section className={styles.Section}>
                <h3 className={styles.Section__Title}>Data</h3>
                <div className={styles.Section__Content}>
                  {config.assayAndResultCategory && (
                    <AssaySelectField
                      value={filter.assayId}
                      onAssayChange={this.handleAssayIdChange}
                      floatingLabelText="Assay"
                      style={{verticalAlign: 'bottom'}}
                    />
                  )}
                  {config.assayAndResultCategory && (
                    <ResultCategorySelectField
                      disabled={!filter.assayId}
                      assayId={filter.assayId}
                      value={filter.resultCategoryId}
                      onResultCategoryChange={this.handleResultCategoryChange}
                      floatingLabelText="Result"
                      style={{verticalAlign: 'bottom'}}
                    />
                  )}
                  {config.deviceName && (
                    <TextField
                      name="deviceName"
                      value={filter.deviceName}
                      onChange={this.handleTextFieldChange}
                      floatingLabelText="Device name"
                    />
                  )}
                  {config.siteName && (
                    <TextField
                      name="siteName"
                      value={filter.siteName}
                      onChange={this.handleTextFieldChange}
                      floatingLabelText="Site name"
                    />
                  )}
                  {config.contactNameOrEmail && (
                    <TextField
                      name="contactNameOrEmail"
                      value={filter.contactNameOrEmail}
                      onChange={this.handleTextFieldChange}
                      floatingLabelText="Contact name/email"
                    />
                  )}
                </div>
              </section>
            )}
          </CardText>
          <CardActions expandable>
            <FlatButton label="Share" />
            <FlatButton label="Save" />
            <FlatButton label="Clear" style={{float: 'right'}} onTouchTap={this.props.onClearFilter} />
          </CardActions>
        </Card>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    config: state.filter.listConfig,
    filter: state.filter.listFilter.toJS()
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onClearFilter: clearListFilter,
    onChangeFilter: _.flowRight(changeListFilter, Immutable.fromJS)
  }, dispatch)
}

export const ListFilterContainer = _.flowRight(
  connect(mapStateToProps, mapDispatchToProps)
)(ListFilter)

export default ListFilterContainer
