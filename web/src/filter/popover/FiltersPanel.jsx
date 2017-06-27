import classnames from 'classnames/bind'
import { compose, withState, withHandlers } from 'recompose'
import React from 'react'
import ReactDOM from 'react-dom'
import { defineMessages } from 'react-intl'
import MdKeyboardArrowDown from 'react-icons/lib/md/keyboard-arrow-down'
import { Overlay } from 'react-toolbox/lib/overlay'
import { Card } from 'react-toolbox/lib/card'
import { Button } from 'react-toolbox/lib/button'

import FallbackUntilDone from '../../components/shared/FallbackUntilDone'
import FocusBlurTextField from '../../components/shared/FocusBlurTextField'
import CountrySelectField from '../geography/CountrySelectField'
import StateSelectField from '../geography/StateSelectField'
import LgaSelectField from '../geography/LgaSelectField'
import PartnerSelectField from '../partner/PartnerSelectField'
import AssaySelectField from '../resource/AssaySelectField'
import ResultCategorySelectField from '../resource/ResultCategorySelectField'
import ConsumableSelectField from '../resource/ConsumableSelectField'
import SiteAutoCompleteField from '../resource/SiteAutoCompleteField'
import DateRangeSelector from '../date/DateRangeSelector'
import ResultWorkflowStatusSelectField from '../resource/ResultWorkflowStatusSelectField'
import DeviceStatusSelectField from '../resource/DeviceStatusSelectField'

const cssClasses = classnames.bind(require('./FiltersPanel.css'))

const enhance = compose(
  withState('isShown', 'setIsShown', false),
  withHandlers({
    onToggleShown: ({ setIsShown }) => () => setIsShown(isShown => !isShown),

    onAssayChange: ({ onChangeFilter }) => assayId =>
      onChangeFilter({ assayId }),

    onDateChange: ({ onChangeFilter }) => dateValues =>
      onChangeFilter(dateValues),

    onCountryChange: ({ onChangeFilter }) => countryId =>
      onChangeFilter({
        countryId,
        stateId: undefined,
        lgaId: undefined,
      }),

    onStateChange: ({ onChangeFilter }) => stateId =>
      onChangeFilter({
        stateId,
        lgaId: undefined,
      }),

    onLgaChange: ({ onChangeFilter }) => lgaId =>
      onChangeFilter({
        lgaId,
      }),

    onResultCategoryChange: ({ onChangeFilter }) => resultCategoryId =>
      onChangeFilter({
        resultCategoryId,
      }),

    onTextFieldCommitValue: ({ onChangeFilter }) => ({
      target: { name, value },
    }) =>
      onChangeFilter({
        [name]: value,
      }),

    onConsumableIdChange: ({ onChangeFilter }) => consumableId =>
      onChangeFilter({
        consumableId,
      }),

    onPartnerIdChange: ({ onChangeFilter }) => partnerId =>
      onChangeFilter({
        partnerId,
      }),

    onSampleOriginSiteChange: ({ onChangeFilter }) => sampleOriginSite =>
      onChangeFilter({
        sampleOriginSite,
      }),

    onSiteNameChange: ({ onChangeFilter }) => siteName =>
      onChangeFilter({
        siteName,
      }),

    onWorkflowStatusIdChange: ({ onChangeFilter }) => workflowStatusId =>
      onChangeFilter({
        workflowStatusId,
      }),

    onDeviceStatusIdChange: ({ onChangeFilter }) => deviceStatusId =>
      onChangeFilter({
        deviceStatusId,
      }),

    onExcelExport: props => () =>
      clickExport(props, props.exportFormatTypes.EXCEL),
    onCsvExport: props => () => clickExport(props, props.exportFormatTypes.CSV),

    onDisagreedConfirmation: ({ closeExportConfirmation }) => () =>
      closeExportConfirmation(),
    onAgreedConfirmation: ({
      listExport,
      beginListExportProcessing,
      onClickExport,
      closeExportConfirmation,
    }) => () => {
      beginListExportProcessing(listExport.currentFormatType)
      onClickExport(listExport.currentFormatType)
      closeExportConfirmation()
    },
  })
)

const clickExport = (
  {
    askConfirmationForExport,
    askExportConfirmation,
    beginListExportProcessing,
    onClickExport,
  },
  formatType
) => {
  if (askConfirmationForExport === true) {
    askExportConfirmation(formatType)
  } else {
    beginListExportProcessing(formatType)
    onClickExport(formatType)
  }
}

const messages = defineMessages({
  moreFilters: {
    id: 'filter.popover.moreFilters',
    defaultMessage: 'More Filters',
  },
  close: {
    id: 'filter.popover.close',
    defaultMessage: 'Close',
  },
  all: {
    id: 'filter.popover.all',
    defaultMessage: 'All',
  },
  none: {
    id: 'filter.popover.none',
    defaultMessage: 'None',
  },
  contactNameEmail: {
    id: 'filter.popover.contactNameEmail',
    defaultMessage: 'Contact name/email',
  },
  setContactNameEmail: {
    id: 'filter.popover.setContactNameEmail',
    defaultMessage: 'Enter contact name/email...',
  },
  site: {
    id: 'filter.popover.site',
    defaultMessage: 'Site',
  },
  enterSiteName: {
    id: 'filter.popover.enterSiteName',
    defaultMessage: 'Enter site name...',
  },
  sampleOriginSite: {
    id: 'filter.popover.sampleOriginSite',
    defaultMessage: 'Sample origin site',
  },
  enterSampleOriginSite: {
    id: 'filter.popover.enterSampleOriginSite',
    defaultMessage: 'Enter sample origin site name...',
  },
  date: {
    id: 'filter.popover.date',
    defaultMessage: 'Date',
  },
  deviceName: {
    id: 'filter.popover.deviceName',
    defaultMessage: 'Device',
  },
  enterDeviceName: {
    id: 'filter.popover.enterDeviceName',
    defaultMessage: 'Enter device name...',
  },
  consumable: {
    id: 'filter.popover.consumable',
    defaultMessage: 'Consumable',
  },
  selectConsumable: {
    id: 'filter.popover.selectConsumable',
    defaultMessage: 'Select consumable...',
  },
  partner: {
    id: 'filter.popover.partner',
    defaultMessage: 'Partner',
  },
  selectPartner: {
    id: 'filter.popover.selectPartner',
    defaultMessage: 'Select partner...',
  },
  patientOrResearchId: {
    id: 'filter.popover.patientOrResearchId',
    defaultMessage: 'Patient/Study ID',
  },
  enterPatientOrResearchId: {
    id: 'filter.popover.enterPatientOrResearchId',
    defaultMessage: 'Enter patient/study ID...',
  },
  sampleId: {
    id: 'filter.popover.sampleId',
    defaultMessage: 'Sample ID',
  },
  enterSampleId: {
    id: 'filter.popover.enterSampleId',
    defaultMessage: 'Enter sample ID...',
  },
  sampleGroup: {
    id: 'filter.popover.sampleGroup',
    defaultMessage: 'Sample Group',
  },
  enterSampleGroup: {
    id: 'filter.popover.enterSampleGroup',
    defaultMessage: 'Enter sample group...',
  },
  result: {
    id: 'filter.popover.result',
    defaultMessage: 'Result',
  },
  selectResult: {
    id: 'filter.popover.selectResult',
    defaultMessage: 'Select result...',
  },
  assay: {
    id: 'filter.popover.assay',
    defaultMessage: 'Assay',
  },
  selectAssay: {
    id: 'filter.popover.selectAssay',
    defaultMessage: 'Select assay...',
  },
  lga: {
    id: 'filter.popover.lga',
    defaultMessage: 'Area',
  },
  selectLga: {
    id: 'filter.popover.selectLga',
    defaultMessage: 'Select area...',
  },
  state: {
    id: 'filter.popover.state',
    defaultMessage: 'State',
  },
  selectState: {
    id: 'filter.popover.selectState',
    defaultMessage: 'Select state...',
  },
  country: {
    id: 'filter.popover.country',
    defaultMessage: 'Country',
  },
  selectCountry: {
    id: 'filter.popover.selectCountry',
    defaultMessage: 'Select country...',
  },
  setFilters: {
    id: 'filter.popover.setFilters',
    defaultMessage: 'Set Filters',
  },

  exportExcel: {
    id: 'pages.ListExport.exportExcel',
    defaultMessage: 'Excel',
  },
  exportCsv: {
    id: 'pages.ListExport.exportCsv',
    defaultMessage: 'CSV',
  },
  workflowStatus: {
    id: 'filter.popover.workflowStatus',
    defaultMessage: 'Workflow Status',
  },
  selectWorkflowStatus: {
    id: 'filter.popover.selectWorkflowStatus',
    defaultMessage: 'Select status...',
  },
  deviceStatus: {
    id: 'filter.popover.deviceStatus',
    defaultMessage: 'Device Status',
  },
  selectDeviceStatus: {
    id: 'filter.popover.selectDeviceStatus',
    defaultMessage: 'Select status...',
  },
  externalId: {
    id: 'filter.popover.externalId',
    defaultMessage: 'Facility Code',
  },
  enterExternalId: {
    id: 'filter.popover.enterExternalId',
    defaultMessage: 'Enter facility code...',
  },
})

export const FiltersPanel = ({
  intl: { formatMessage },
  contentClassName,

  filters,
  config,
  dateFilterLabel,
  // --- injected by recompose ---
  onToggleShown,
  isShown,
  onCountryChange,
  onStateChange,
  onLgaChange,
  onAssayChange,
  onResultCategoryChange,
  onConsumableIdChange,
  onPartnerIdChange,
  onTextFieldCommitValue,
  onSiteNameChange,
  onSampleOriginSiteChange,
  onDateChange,
  onWorkflowStatusIdChange,
  onDeviceStatusIdChange,
}) =>
  <div className={cssClasses('Container')}>
    <Button
      primary
      onClick={onToggleShown}
      theme={{
        flat: cssClasses('Button--flat'),
        primary: cssClasses('Button--primary'),
      }}
    >
      <span className={cssClasses('Button__label')}>
        <span
          className={cssClasses('Button__label__close', {
            'Button__label--shown': isShown,
          })}
        >
          {formatMessage(messages.close)}
        </span>
        <span
          className={cssClasses('Button__label__more', {
            'Button__label--shown': !isShown,
          })}
        >
          {formatMessage(messages.moreFilters)}
        </span>
      </span>
      <MdKeyboardArrowDown
        className={cssClasses('Button__icon', {
          'Button__icon--shown': isShown,
        })}
      />
    </Button>
    <Overlay
      className={cssClasses('Overlay')}
      active={isShown}
      onClick={onToggleShown}
      onEscKeyDown={onToggleShown}
    />
    <div
      className={cssClasses('Popover', {
        'Popover--shown': isShown,
      })}
    >
      <FallbackUntilDone
        component={Card}
        className={cssClasses(contentClassName, 'FallbackUntilDone')}
        fallbacks={[
          {
            className: cssClasses('FallbackUntilDone--xs'),
          },
          {
            className: cssClasses('FallbackUntilDone--sm'),
          },
          {
            className: cssClasses('FallbackUntilDone--md'),
          },
        ]}
        isDone={ref => {
          const node = ReactDOM.findDOMNode(ref) // eslint-disable-line react/no-find-dom-node
          const { width, bottom } = node.getBoundingClientRect()
          const { innerWidth, innerHeight } = window
          const aboutToFillHorizontally = width + 200 > innerWidth
          const canFillInVertically = bottom < innerHeight
          return aboutToFillHorizontally || canFillInVertically
        }}
      >
        {config.geography &&
          <div className={cssClasses('Control')}>
            <CountrySelectField
              allItemText={formatMessage(messages.all)}
              onChangeCountry={onCountryChange}
              countryId={filters.countryId}
              floatingLabelFixed
              hintText={formatMessage(messages.selectCountry)}
              floatingLabelText={formatMessage(messages.country)}
              style={{ verticalAlign: 'bottom' }}
            />
          </div>}
        {config.geography &&
          config.state &&
          <div className={cssClasses('Control')}>
            <StateSelectField
              allItemText={formatMessage(messages.all)}
              onChangeState={onStateChange}
              countryId={filters.countryId}
              stateId={filters.stateId}
              floatingLabelFixed
              hintText={formatMessage(messages.selectState)}
              floatingLabelText={formatMessage(messages.state)}
              style={{ verticalAlign: 'bottom' }}
            />
          </div>}
        {config.geography &&
          config.state &&
          config.lga &&
          <div className={cssClasses('Control')}>
            <LgaSelectField
              allItemText={formatMessage(messages.all)}
              onChangeLga={onLgaChange}
              countryId={filters.countryId}
              stateId={filters.stateId}
              lgaId={filters.lgaId}
              floatingLabelFixed
              hintText={formatMessage(messages.selectLga)}
              floatingLabelText={formatMessage(messages.lga)}
              style={{ verticalAlign: 'bottom' }}
            />
          </div>}
        {config.assayAndResultCategory &&
          <div className={cssClasses('Control')}>
            <AssaySelectField
              allItemText={formatMessage(messages.all)}
              value={filters.assayId}
              onAssayChange={onAssayChange}
              floatingLabelFixed
              hintText={formatMessage(messages.selectAssay)}
              floatingLabelText={formatMessage(messages.assay)}
              style={{ verticalAlign: 'bottom' }}
            />
          </div>}
        {config.assayAndResultCategory &&
          <div className={cssClasses('Control')}>
            <ResultCategorySelectField
              allItemText={formatMessage(messages.all)}
              disabled={!filters.assayId}
              assayId={filters.assayId}
              value={filters.resultCategoryId}
              onResultCategoryChange={onResultCategoryChange}
              floatingLabelFixed
              hintText={formatMessage(messages.selectResult)}
              floatingLabelText={formatMessage(messages.result)}
              style={{ verticalAlign: 'bottom' }}
            />
          </div>}
        {config.consumable &&
          <div className={cssClasses('Control')}>
            <ConsumableSelectField
              allItemText={formatMessage(messages.all)}
              value={filters.consumableId}
              onConsumableChange={onConsumableIdChange}
              floatingLabelFixed
              hintText={formatMessage(messages.selectConsumable)}
              floatingLabelText={formatMessage(messages.consumable)}
              style={{ verticalAlign: 'bottom' }}
              autoWidth
            />
          </div>}
        {config.partnerId &&
          <div className={cssClasses('Control')}>
            <PartnerSelectField
              emptyId="-1"
              emptyText={formatMessage(messages.none)}
              partnerId={filters.partnerId}
              onChangePartner={onPartnerIdChange}
              floatingLabelFixed
              hintText={formatMessage(messages.selectPartner)}
              floatingLabelText={formatMessage(messages.partner)}
              style={{ verticalAlign: 'bottom' }}
              autoWidth
            />
          </div>}
        {config.patientOrResearchId &&
          <div className={cssClasses('Control')}>
            <FocusBlurTextField
              name="patientOrResearchId"
              value={filters.patientOrResearchId || ''}
              onCommitValue={onTextFieldCommitValue}
              floatingLabelFixed
              hintText={formatMessage(messages.enterPatientOrResearchId)}
              floatingLabelText={formatMessage(messages.patientOrResearchId)}
            />
          </div>}
        {config.sampleId &&
          <div className={cssClasses('Control')}>
            <FocusBlurTextField
              name="sampleId"
              value={filters.sampleId || ''}
              onCommitValue={onTextFieldCommitValue}
              floatingLabelFixed
              hintText={formatMessage(messages.enterSampleId)}
              floatingLabelText={formatMessage(messages.sampleId)}
            />
          </div>}
        {config.sampleGroup &&
          <div className={cssClasses('Control')}>
            <FocusBlurTextField
              name="sampleGroup"
              value={filters.sampleGroup || ''}
              onCommitValue={onTextFieldCommitValue}
              floatingLabelFixed
              hintText={formatMessage(messages.enterSampleGroup)}
              floatingLabelText={formatMessage(messages.sampleGroup)}
            />
          </div>}
        {config.deviceName &&
          <div className={cssClasses('Control')}>
            <FocusBlurTextField
              name="deviceName"
              value={filters.deviceName || ''}
              onCommitValue={onTextFieldCommitValue}
              floatingLabelFixed
              hintText={formatMessage(messages.enterDeviceName)}
              floatingLabelText={formatMessage(messages.deviceName)}
            />
          </div>}
        {config.siteName &&
          <div className={cssClasses('Control')}>
            <SiteAutoCompleteField
              name="siteName"
              value={filters.siteName || ''}
              onChangeSite={onSiteNameChange}
              floatingLabelFixed
              itemTextGetter={site =>
                `${site.get('name')} (${site.get('state')})`}
              hintText={formatMessage(messages.enterSiteName)}
              floatingLabelText={formatMessage(messages.site)}
            />
          </div>}
        {config.sampleOriginSite &&
          <div className={cssClasses('Control')}>
            <SiteAutoCompleteField
              name="sampleOriginSite"
              value={filters.sampleOriginSite || ''}
              onChangeSite={onSampleOriginSiteChange}
              floatingLabelFixed
              itemTextGetter={site =>
                `${site.get('name')} (${site.get('state')})`}
              hintText={formatMessage(messages.enterSampleOriginSite)}
              floatingLabelText={formatMessage(messages.sampleOriginSite)}
            />
          </div>}
        {config.contactNameOrEmail &&
          <div className={cssClasses('Control')}>
            <FocusBlurTextField
              name="contactNameOrEmail"
              value={filters.contactNameOrEmail || ''}
              onCommitValue={onTextFieldCommitValue}
              floatingLabelFixed
              hintText={formatMessage(messages.setContactNameEmail)}
              floatingLabelText={formatMessage(messages.contactNameEmail)}
            />
          </div>}
        {config.externalId &&
          <div className={cssClasses('Control')}>
            <FocusBlurTextField
              name="externalId"
              value={filters.externalId || ''}
              onCommitValue={onTextFieldCommitValue}
              floatingLabelFixed
              hintText={formatMessage(messages.enterExternalId)}
              floatingLabelText={formatMessage(messages.externalId)}
            />
          </div>}
        {config.workflowStatus &&
          <div className={cssClasses('Control')}>
            <ResultWorkflowStatusSelectField
              allItemText={formatMessage(messages.all)}
              value={filters.workflowStatusId}
              onWorkflowStatusChange={onWorkflowStatusIdChange}
              floatingLabelFixed
              hintText={formatMessage(messages.selectWorkflowStatus)}
              floatingLabelText={formatMessage(messages.workflowStatus)}
              style={{ verticalAlign: 'bottom' }}
              autoWidth
            />
          </div>}
        {config.deviceStatus &&
          <div className={cssClasses('Control')}>
            <DeviceStatusSelectField
              allItemText={formatMessage(messages.all)}
              value={filters.deviceStatusId}
              onDeviceStatusChange={onDeviceStatusIdChange}
              floatingLabelFixed
              hintText={formatMessage(messages.selectDeviceStatus)}
              floatingLabelText={formatMessage(messages.deviceStatus)}
              style={{ verticalAlign: 'bottom' }}
              autoWidth
            />
          </div>}
        {config.date &&
          <DateRangeSelector
            floatingLabelText={dateFilterLabel || formatMessage(messages.date)}
            onChangeDate={onDateChange}
            datePickerContainer="dialog"
            controlClassName={cssClasses('Control')}
            minDate={filters.minDate}
            maxDate={filters.maxDate}
            autoOk
          />}
      </FallbackUntilDone>
    </div>
  </div>

export default enhance(FiltersPanel)
