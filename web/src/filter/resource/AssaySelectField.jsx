// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { defineMessages } from 'react-intl'
import Immutable from 'immutable'
import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import { fetchAssays } from '../../assay/AssayRedux'

const messages = defineMessages({
  AssayAbbottM2000DBSHivVl: {
    id: 'filter.AssaySelectField.AssayAbbottM2000DBSHivVl',
    defaultMessage: 'Abbott m2000 DBS HIV VL',
  },
  AssayAbbottM2000HivEid: {
    id: 'filter.AssaySelectField.AssayAbbottM2000HivEid',
    defaultMessage: 'Abbott m2000 HIV EID',
  },
  abbottM2000PlasmaHbvVL: {
    id: 'filter.AssaySelectField.abbottM2000PlasmaHbvVL',
    defaultMessage: 'Abbott m2000 Plasma HBV VL',
  },
  abbottM2000PlasmaHivVL: {
    id: 'filter.AssaySelectField.abbottM2000PlasmaHivVL',
    defaultMessage: 'Abbott m2000 Plasma HIV VL',
  },
  assayAlereQHiv12Detect: {
    id: 'filter.AssaySelectField.assayAlereQHiv12Detect',
    defaultMessage: 'Alere Q HIV-1/2 Detect',
  },
  assayAlereQHiv12VLPlasma: {
    id: 'filter.AssaySelectField.assayAlereQHiv12VLPlasma',
    defaultMessage: 'Alere Q HIV-1/2 VL plasma',
  },
  assayBdMgitAst: {
    id: 'filter.AssaySelectField.assayBdMgitAst',
    defaultMessage: 'BD MGIT AST',
  },
  assayBdMgitGnd: {
    id: 'filter.AssaySelectField.assayBdMgitGnd',
    defaultMessage: 'BD MGIT GND',
  },
  assayCobasHivVl: {
    id: 'filter.AssaySelectField.assayCobasHivVl',
    defaultMessage: 'COBAS 4800 VL',
  },
  assayGenericCovid19: {
    id: 'filter.AssaySelectField.assayGenericCovid19',
    defaultMessage: 'COVID-19 Generic Test',
  },
  assayCulture: {
    id: 'filter.AssaySelectField.assayCulture',
    defaultMessage: 'Culture',
  },
  assayGXCovid19: {
    id: 'filter.AssaySelectField.assayGXCovid19',
    defaultMessage: 'GeneXpert COVID-19',
  },
  assayGeneXpertEbola: {
    id: 'filter.AssaySelectField.assayGeneXpertEbola',
    defaultMessage: 'GeneXpert Ebola',
  },
  assayGeneXpertHcv: {
    id: 'filter.AssaySelectField.assayGeneXpertHcv',
    defaultMessage: 'GeneXpert HCV',
  },
  assayGeneXpertHiv1Qual: {
    id: 'filter.AssaySelectField.assayGeneXpertHiv1Qual',
    defaultMessage: 'GeneXpert HIV-1 Qual',
  },
  assayGeneXpertHiv1Vl: {
    id: 'filter.AssaySelectField.assayGeneXpertHiv1Vl',
    defaultMessage: 'GeneXpert HIV-1 VL',
  },
  assayGeneXpertMtbRif: {
    id: 'filter.AssaySelectField.assayGeneXpertMtbRif',
    defaultMessage: 'GeneXpert MTB/Rif',
  },
  assayGeneXpertMtbRifUltra: {
    id: 'filter.AssaySelectField.assayGeneXpertMtbRifUltra',
    defaultMessage: 'GeneXpert MTB/Rif Ultra',
  },
  assayGeneXpertUnknown: {
    id: 'filter.AssaySelectField.assayGeneXpertUnknown',
    defaultMessage: 'GeneXpert Unknown',
  },
  assayGenoTypeMTBCV1: {
    id: 'filter.AssaySelectField.assayGenoTypeMTBCV1',
    defaultMessage: 'GenoType MTBC VER 1.X',
  },
  assayGenoTypeMTBDRplusV2: {
    id: 'filter.AssaySelectField.assayGenoTypeMTBDRplusV2',
    defaultMessage: 'GenoType MTBDRplus VER 2.0',
  },
  assayGenoTypeMTBDRslV1: {
    id: 'filter.AssaySelectField.assayGenoTypeMTBDRslV1',
    defaultMessage: 'GenoType MTBDRsl VER 1.0',
  },
  assayGenoTypeMTBDRslV2: {
    id: 'filter.AssaySelectField.assayGenoTypeMTBDRslV2',
    defaultMessage: 'GenoType MTBDRsl VER 2.0',
  },
  assayMP96Covid19: {
    id: 'filter.AssaySelectField.assayMP96Covid19',
    defaultMessage: 'MagNA Pure-96 COVID-19',
  },
  assayQHivVl: {
    id: 'filter.AssaySelectField.assayQHivVl',
    defaultMessage: 'Q HIV VL',
  },
  assayQS7Covid19: {
    id: 'filter.AssaySelectField.assayQS7Covid19',
    defaultMessage: 'QuantStudio7 Flex COVID-19',
  },
  AssayReporterEid: {
    id: 'filter.AssaySelectField.AssayReporterEid',
    defaultMessage: 'Reporter EID',
  },
  AssayReporterHivVl: {
    id: 'filter.AssaySelectField.AssayReporterHivVl',
    defaultMessage: 'Reporter HIV VL',
  },
  assaySenaiteLIMSSmearMicroscopy: {
    id: 'filter.AssaySelectField.assaySenaiteLIMSSmearMicroscopy',
    defaultMessage: 'Senaite LIMS Smear Microscopy',
  },
  assaySenaiteLIMSTbCulture: {
    id: 'filter.AssaySelectField.assaySenaiteLIMSTbCulture',
    defaultMessage: 'Senaite LIMS TB Culture',
  },
  assaySenaiteLIMSUnknown: {
    id: 'filter.AssaySelectField.assaySenaiteLIMSUnknown',
    defaultMessage: 'Senaite LIMS Unknown',
  },
  assayGenericDst: {
    id: 'filter.AssaySelectField.assayGenericDst',
    defaultMessage: 'TB DST',
  },
})

let validAssays
let isSingleAssay

export class AssaySelectField extends PureComponent {
  static propTypes = {
    // eslint-disable-next-line react/require-default-props
    intl: PropTypes.shape({
      formatMessage: PropTypes.func,
    }),
    allItemText: PropTypes.string,
    fetchAssays: PropTypes.func.isRequired,
    assayItems: PropTypes.instanceOf(Immutable.List).isRequired,
    onAssayChange: PropTypes.func.isRequired,
    diseaseId: PropTypes.string,
    assayTypeId: PropTypes.string,
    deviceTypeId: PropTypes.string,
    value: PropTypes.string,
  }

  static defaultProps = {
    allItemText: 'All',
    diseaseId: '',
    assayTypeId: '',
    deviceTypeId: '',
    value: '',
  }

  constructor(props) {
    super()

    props.fetchAssays(false)

    const { assayItems } = props
    validAssays = assayItems.filter(a => a.get('hasResults'))
    // If there's only one available assay, that unique assay will be set as value
    isSingleAssay = validAssays.size === 1
  }

  componentDidMount() {
    this.setValueIfSingleAssay()
  }

  setValueIfSingleAssay = () => {
    if (isSingleAssay) this.props.value = validAssays.first().get('id')
  }

  handleChange = ({ target: { value } }) => {
    this.props.onAssayChange(value === 'all' ? undefined : value)
  }

  render() {
    const {
      allItemText,
      intl: { formatMessage },
    } = this.props
    const restProps = _.omit(this.props, [
      'allItemText',
      'fetchAssays',
      'assayItems',
      'onAssayChange',
      'value',
    ])
    this.setValueIfSingleAssay()
    const { value, diseaseId, assayTypeId, deviceTypeId } = this.props
    return (
      <SelectField
        {...restProps}
        value={value}
        onChange={this.handleChange}
        disabled={isSingleAssay}
      >
        {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
        {validAssays
          .filter(
            a =>
              (!diseaseId ||
                !a.get('diseaseId') ||
                a.get('diseaseId').toString() === diseaseId.toString()) &&
              (!assayTypeId ||
                !a.get('assayTypeId') ||
                a.get('assayTypeId').toString() === assayTypeId.toString()) &&
              (!deviceTypeId ||
                !a.get('deviceTypeId') ||
                a.get('deviceTypeId').toString() === deviceTypeId.toString())
          )
          .map(a => (
            <MenuItem key={a.get('id')} value={a.get('id')}>
              {formatMessage(messages[a.get('i18nKey')]) || a.get('name')}
            </MenuItem>
          ))}
      </SelectField>
    )
  }
}

function mapStateToProps(state) {
  return {
    assayItems: state.assay.items,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchAssays,
    },
    dispatch
  )
}

export default _.flowRight(connect(mapStateToProps, mapDispatchToProps))(
  AssaySelectField
)
