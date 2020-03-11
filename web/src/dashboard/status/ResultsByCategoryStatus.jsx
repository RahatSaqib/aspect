/* eslint-disable linebreak-style */
import _ from 'lodash'
import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'
import { bindActionCreators } from 'redux'
import {
  compose,
  withProps,
  lifecycle,
  withHandlers,
  pure,
  withState,
} from 'recompose'
import { connect } from 'react-redux'
import Card from '@material-ui/core/Card'

import { addMonths, endOfMonth, format as dateFormat } from 'date-fns'

import {
  FaChartBar as IconTitle,
  FaChartBar as IconBarChart,
} from 'react-icons/fa'
import {
  MdKeyboardArrowLeft as IconArrowLeft,
  MdKeyboardArrowRight as IconArrowRight,
} from 'react-icons/md'
import { ResponsiveBar } from '@nivo/bar'

import { Unit } from '../../components/pureGrids'
import requirePermissions from '../../components/shared/requirePermissions'
import { fetchSitesForSelectList } from '../../site/SiteRedux'
import { fetchTreatmentDashboard } from '../DashboardRedux'
import AspectTooltip from '../../components/shared/AspectTooltip'
import Title from './Title'
import messages from './messages'
import StyledDropdown from '../../components/shared/StyledDropdown'

const cssClasses = classnames.bind(require('./Status.css'))

const changePeriod = (props, shift) => {
  const { lastOn, siteId, fetchTreatmentDashboard } = props
  let { endedOn } = props

  const last = Date.parse(`${lastOn}`)
  let finish = endOfMonth(addMonths(Date.parse(`${endedOn}`), shift))
  if (finish > last) {
    finish = last
  }
  endedOn = dateFormat(finish, 'yyyy-MM-dd')
  fetchTreatmentDashboard({ siteId, endedOn })
}
const enhance = compose(
  pure,
  withState('resultCategoryId', 'setResultCategoryId', ''),
  withState('resultCategoryValue', 'setResultCategoryValue', ''),
  withState('assayTypeId', 'setAssayTypeId', ''),
  requirePermissions({
    permissions: [
      'treatmentStatus:admin',
      'treatmentStatus:view',
      'treatmentStatus:edit',
    ],
    features: ['summaryDashboard', 'siteDashboard', 'deviceDashboard'],
  }),
  connect(
    state => {
      const treatmentStatus = state.dashboard.treatmentStatus.toJS()
      return {
        sitesSelectList: state.site.selectList,
        assayResultCategoryList: state.dashboard.assayResultCategoryList,
        ..._.pick(treatmentStatus, ['siteId', 'endedOn', 'lastOn', 'data']),
      }
    },
    bindActionCreators.bind(null, {
      fetchSitesForSelectList,
      fetchTreatmentDashboard,
    })
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchSitesForSelectList()
      this.props.fetchTreatmentDashboard()
    },
  }),
  withHandlers({
    onChange: ({
      endedOn,
      fetchTreatmentDashboard,
      setResultCategoryId,
      setAssayTypeId,
      assayTypeId,
      resultCategoryId,
      siteId,
      setResultCategoryValue,
    }) => ({ target: { value } }) => {
      const selectedValue = value.split('-')
      assayTypeId = assayTypeId || null
      resultCategoryId = resultCategoryId || null

      if (selectedValue.length > 1) {
        ;[assayTypeId, resultCategoryId] = selectedValue
        setResultCategoryId(() =>
          resultCategoryId > 0 ? resultCategoryId : null
        )
        setAssayTypeId(() => (assayTypeId > 0 ? assayTypeId : null))
        setResultCategoryValue(() => value)
      }

      siteId = selectedValue.length === 1 ? value : siteId

      fetchTreatmentDashboard({
        siteId: siteId || null,
        assayTypeId,
        resultCategoryId,
        endedOn,
      })
    },
    onBack: props => () => changePeriod(props, -1),
    onForward: props => () => changePeriod(props, 1),
  }),
  withProps(
    ({
      intl,
      siteId,
      sitesSelectList,
      theme,
      assayResultCategoryList,
      resultCategoryValue,
    }) => ({
      theme,
      isSingleSite:
        sitesSelectList.items.size === 1 && !sitesSelectList.stateName,
      source: sitesSelectList.items
        .map(item => ({
          value: item.get('id'),
          label: item.get('name'),
        }))
        .insert(0, {
          value: '',
          label: intl.formatMessage(messages.treatmentAllSites, {
            region: sitesSelectList.stateName || sitesSelectList.countryName,
          }),
        })
        .toJS(),
      siteValue: sitesSelectList.items
        .find(it => it.get('id') === siteId, null, Immutable.Map())
        .get('id', ''),
      isSingleAssayResultCategory: assayResultCategoryList.length === 1,
      assayResultCategorySource: assayResultCategoryList
        .map(item => ({
          value: item.get('id'),
          label: item.get('name'),
        }))
        .insert(0, {
          value: '0-0',
          label: intl.formatMessage(messages.assayResultCategoryAll),
        })
        .toJS(),
      resultCategoryValue: assayResultCategoryList.find(
        it => it.get('id') === resultCategoryValue
      ),
    })
  )
)

function getColorWithAlpha(color, opacity) {
  const y = Math.floor(opacity * 255)
  return color + (y < 16 ? '0' : '') + y.toString(16)
}

function filterDropDownField(fieldList, fieldItem, otherProps) {
  return (
    <div
      className={cssClasses(
        'FiltersGroup__Child',
        'FiltersGroup__Child--dropdown'
      )}
    >
      {fieldList.length > 1 &&
        (fieldItem ? (
          <div className={cssClasses('SiteDropdown__Label')}>
            {fieldList[1].label}
          </div>
        ) : (
          <StyledDropdown displayEmpty source={fieldList} {...otherProps} />
        ))}
    </div>
  )
}

export const ResultsByCategoryStatus = ({
  intl,
  className,
  title,

  lastOn,
  endedOn,
  data = [],
  isSingleSite,
  source,
  siteValue,
  assayResultCategorySource,
  isSingleAssayResultCategory,
  resultCategoryValue,
  onForward,
  onBack,
  ...restProps
}) => {
  const series = [
    {
      label: 'Confirmed',
      key: 'pcConfirmed',
      color: process.env['--aspect-color-mantis'], // green
      colorFade: getColorWithAlpha(process.env['--aspect-color-mantis'], 0.5),
    },
    {
      label: 'Not Confirmed',
      key: 'pcNotConfirmed', // calculated value, see reducer for case RECEIVE_TREATMENT_DASHBOARD
      color: process.env['--aspect-color-mandy'], // red
      colorFade: getColorWithAlpha(process.env['--aspect-color-mandy'], 0.5),
    },
  ]
  const tickSeparatorX = `-${50 / data.length}%`

  lastOn = lastOn && dateFormat(new Date(lastOn), 'yyyy-MM')

  return (
    <Card className={className}>
      <div
        className={cssClasses('TitleContainer', 'Treatment--TitleContainer')}
      >
        <Title
          title={title}
          icon={<IconTitle className={cssClasses('Title__Icon')} />}
        />

        <Unit sm="1-8" />
      </div>

      <div style={{ marginTop: 30 }}>Graphs</div>
    </Card>
  )
}

export default enhance(ResultsByCategoryStatus)
