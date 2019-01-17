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

    onAssayChange: ({ onChangeFilters }) => assayId =>
      onChangeFilters({ assayId }),

    onDateChange: ({ onChangeFilters }) => dateValues =>
      onChangeFilters(dateValues),

    onCountryIdChange: ({ onChangeFilters }) => countryId =>
      onChangeFilters({
        countryId,
        stateId: undefined,
        lgaId: undefined,
      }),

    onStateIdChange: ({ onChangeFilters }) => stateId =>
      onChangeFilters({
        stateId,
        lgaId: undefined,
      }),

    onLgaIdChange: ({ onChangeFilters }) => lgaId =>
      onChangeFilters({
        lgaId,
      }),

    onResultCategoryChange: ({ onChangeFilters }) => resultCategoryId =>
      onChangeFilters({
        resultCategoryId,
      }),

    onTextFieldCommitValue: ({ onChangeFilters }) => ({
      target: { name, value },
    }) =>
      onChangeFilters({
        [name]: value,
      }),

    onConsumableIdChange: ({ onChangeFilters }) => consumableId =>
      onChangeFilters({
        consumableId,
      }),

    onPartnerIdChange: ({ onChangeFilters }) => partnerId =>
      onChangeFilters({
        partnerId,
      }),

    onSampleOriginSiteChange: ({ onChangeFilters }) => sampleOriginSite =>
      onChangeFilters({
        sampleOriginSite,
      }),

    onSiteNameChange: ({ onChangeFilters }) => siteName =>
      onChangeFilters({
        siteName,
      }),

    onWorkflowStatusIdChange: ({ onChangeFilters }) => workflowStatusId =>
      onChangeFilters({
        workflowStatusId,
      }),

    onDeviceStatusIdChange: ({ onChangeFilters }) => deviceStatusId =>
      onChangeFilters({
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
    defaultMessage: 'More filters',
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
  intl,
  className,
  disabled,
  contentClassName,

  filters,
  config,
  dateFilterLabel,
  // --- injected by recompose ---
  onToggleShown,
  isShown,
  onCountryIdChange,
  onStateIdChange,
  onLgaIdChange,
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
}) => (
  <div className={cssClasses('Container', className)}>
    <Button
      className={cssClasses('Button')}
      primary
      inverse
      disabled={disabled}
      onClick={onToggleShown}
    >
      <span className={cssClasses('Button__label')}>
        <span
          className={cssClasses('Button__label__close', {
            'Button__label--shown': isShown,
          })}
        >
          {intl.formatMessage(messages.close)}
        </span>
        <span
          className={cssClasses('Button__label__more', {
            'Button__label--shown': !isShown,
          })}
        >
          {intl.formatMessage(messages.moreFilters)}
        </span>
      </span>
      <MdKeyboardArrowDown
        className={cssClasses('Button__icon', {
          'Button__icon--shown': isShown,
        })}
      />
    </Button>
    <Overlay
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
        {config.geography && (
          <div className={cssClasses('Control')}>
            <CountrySelectField
              allItemText={intl.formatMessage(messages.all)}
              onCountryIdChange={onCountryIdChange}
              countryId={filters.countryId}
              floatingLabelFixed
              hintText={intl.formatMessage(messages.selectCountry)}
              floatingLabelText={intl.formatMessage(messages.country)}
              style={{ verticalAlign: 'bottom' }}
            />
          </div>
        )}
        {config.geography &&
          config.state && (
            <div className={cssClasses('Control')}>
              <StateSelectField
                allItemText={intl.formatMessage(messages.all)}
                onStateIdChange={onStateIdChange}
                countryId={filters.countryId}
                stateId={filters.stateId}
                floatingLabelFixed
                hintText={intl.formatMessage(messages.selectState)}
                floatingLabelText={intl.formatMessage(messages.state)}
                style={{ verticalAlign: 'bottom' }}
              />
            </div>
          )}
        {config.geography &&
          config.state &&
          config.lga && (
            <div className={cssClasses('Control')}>
              <LgaSelectField
                allItemText={intl.formatMessage(messages.all)}
                onLgaIdChange={onLgaIdChange}
                countryId={filters.countryId}
                stateId={filters.stateId}
                lgaId={filters.lgaId}
                floatingLabelFixed
                hintText={intl.formatMessage(messages.selectLga)}
                floatingLabelText={intl.formatMessage(messages.lga)}
                style={{ verticalAlign: 'bottom' }}
              />
            </div>
          )}
        {config.assayAndResultCategory && (
          <div className={cssClasses('Control')}>
            <AssaySelectField
              allItemText={intl.formatMessage(messages.all)}
              value={filters.assayId}
              onAssayChange={onAssayChange}
              floatingLabelFixed
              hintText={intl.formatMessage(messages.selectAssay)}
              floatingLabelText={intl.formatMessage(messages.assay)}
              style={{ verticalAlign: 'bottom' }}
            />
          </div>
        )}
        {config.assayAndResultCategory && (
          <div className={cssClasses('Control')}>
            <ResultCategorySelectField
              allItemText={intl.formatMessage(messages.all)}
              disabled={!filters.assayId}
              assayId={filters.assayId}
              value={filters.resultCategoryId}
              onResultCategoryChange={onResultCategoryChange}
              floatingLabelFixed
              hintText={intl.formatMessage(messages.selectResult)}
              floatingLabelText={intl.formatMessage(messages.result)}
              style={{ verticalAlign: 'bottom' }}
            />
          </div>
        )}
        {config.consumable && (
          <div className={cssClasses('Control')}>
            <ConsumableSelectField
              allItemText={intl.formatMessage(messages.all)}
              value={filters.consumableId}
              onConsumableChange={onConsumableIdChange}
              floatingLabelFixed
              hintText={intl.formatMessage(messages.selectConsumable)}
              floatingLabelText={intl.formatMessage(messages.consumable)}
              style={{ verticalAlign: 'bottom' }}
              autoWidth
            />
          </div>
        )}
        {config.partnerId && (
          <div className={cssClasses('Control')}>
            <PartnerSelectField
              emptyId="-1"
              emptyText={intl.formatMessage(messages.none)}
              partnerId={filters.partnerId}
              onChangePartner={onPartnerIdChange}
              floatingLabelFixed
              hintText={intl.formatMessage(messages.selectPartner)}
              floatingLabelText={intl.formatMessage(messages.partner)}
              style={{ verticalAlign: 'bottom' }}
              autoWidth
            />
          </div>
        )}
        {config.patientOrResearchId && (
          <div className={cssClasses('Control')}>
            <FocusBlurTextField
              name="patientOrResearchId"
              value={filters.patientOrResearchId || ''}
              onCommitValue={onTextFieldCommitValue}
              InputLabelProps={{
                shrink: true,
              }}
              placeholder={intl.formatMessage(
                messages.enterPatientOrResearchId
              )}
              label={intl.formatMessage(messages.patientOrResearchId)}
              margin="normal"
            />
          </div>
        )}
        {config.sampleId && (
          <div className={cssClasses('Control')}>
            <FocusBlurTextField
              name="sampleId"
              value={filters.sampleId || ''}
              onCommitValue={onTextFieldCommitValue}
              InputLabelProps={{
                shrink: true,
              }}
              placeholder={intl.formatMessage(messages.enterSampleId)}
              label={intl.formatMessage(messages.sampleId)}
              margin="normal"
            />
          </div>
        )}
        {config.sampleGroup && (
          <div className={cssClasses('Control')}>
            <FocusBlurTextField
              name="sampleGroup"
              value={filters.sampleGroup || ''}
              onCommitValue={onTextFieldCommitValue}
              InputLabelProps={{
                shrink: true,
              }}
              placeholder={intl.formatMessage(messages.enterSampleGroup)}
              label={intl.formatMessage(messages.sampleGroup)}
              margin="normal"
            />
          </div>
        )}
        {config.deviceName && (
          <div className={cssClasses('Control')}>
            <FocusBlurTextField
              name="deviceName"
              value={filters.deviceName || ''}
              onCommitValue={onTextFieldCommitValue}
              InputLabelProps={{
                shrink: true,
              }}
              placeholder={intl.formatMessage(messages.enterDeviceName)}
              label={intl.formatMessage(messages.deviceName)}
              margin="normal"
            />
          </div>
        )}
        {config.siteName && (
          <div className={cssClasses('Control')}>
            <SiteAutoCompleteField
              name="siteName"
              value={filters.siteName || ''}
              onSiteNameChange={onSiteNameChange}
              floatingLabelFixed
              hintText={intl.formatMessage(messages.enterSiteName)}
              floatingLabelText={intl.formatMessage(messages.site)}
            />
          </div>
        )}
        {config.sampleOriginSite && (
          <div className={cssClasses('Control')}>
            <SiteAutoCompleteField
              name="sampleOriginSite"
              value={filters.sampleOriginSite || ''}
              onSiteIdChange={onSampleOriginSiteChange}
              floatingLabelFixed
              hintText={intl.formatMessage(messages.enterSampleOriginSite)}
              floatingLabelText={intl.formatMessage(messages.sampleOriginSite)}
            />
          </div>
        )}
        {config.contactNameOrEmail && (
          <div className={cssClasses('Control')}>
            <FocusBlurTextField
              name="contactNameOrEmail"
              value={filters.contactNameOrEmail || ''}
              onCommitValue={onTextFieldCommitValue}
              InputLabelProps={{
                shrink: true,
              }}
              placeholder={intl.formatMessage(messages.setContactNameEmail)}
              label={intl.formatMessage(messages.contactNameEmail)}
              margin="normal"
            />
          </div>
        )}
        {config.externalId && (
          <div className={cssClasses('Control')}>
            <FocusBlurTextField
              name="externalId"
              value={filters.externalId || ''}
              onCommitValue={onTextFieldCommitValue}
              InputLabelProps={{
                shrink: true,
              }}
              placeholder={intl.formatMessage(messages.enterExternalId)}
              label={intl.formatMessage(messages.externalId)}
              margin="normal"
            />
          </div>
        )}
        {config.workflowStatus && (
          <div className={cssClasses('Control')}>
            <ResultWorkflowStatusSelectField
              allItemText={intl.formatMessage(messages.all)}
              value={filters.workflowStatusId}
              onWorkflowStatusChange={onWorkflowStatusIdChange}
              floatingLabelFixed
              hintText={intl.formatMessage(messages.selectWorkflowStatus)}
              floatingLabelText={intl.formatMessage(messages.workflowStatus)}
              style={{ verticalAlign: 'bottom' }}
              autoWidth
            />
          </div>
        )}
        {config.deviceStatus && (
          <div className={cssClasses('Control')}>
            <DeviceStatusSelectField
              allItemText={intl.formatMessage(messages.all)}
              value={filters.deviceStatusId}
              onDeviceStatusChange={onDeviceStatusIdChange}
              floatingLabelFixed
              hintText={intl.formatMessage(messages.selectDeviceStatus)}
              floatingLabelText={intl.formatMessage(messages.deviceStatus)}
              style={{ verticalAlign: 'bottom' }}
              autoWidth
            />
          </div>
        )}
        {config.date && (
          <DateRangeSelector
            floatingLabelText={
              dateFilterLabel || intl.formatMessage(messages.date)
            }
            onChangeDate={onDateChange}
            controlClassName={cssClasses('Control')}
            minDate={filters.minDate}
            maxDate={filters.maxDate}
            autoOk
          />
        )}
      </FallbackUntilDone>
    </div>
  </div>
)

export default enhance(FiltersPanel)
