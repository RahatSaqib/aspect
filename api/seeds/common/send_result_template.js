const { EXTERNAL_IDS } = require('../../src/shared/constants')

module.exports = {
  externalId: EXTERNAL_IDS.SEND_RESULT_TO_CEPHEID,
  method: 'POST',
  url: `https://datareceiver-dev.stg.c360.cepheid.com/datareceiver/api/v1/{{urlEncode device.stickerInstrumentSerial}}/instrumentTests`,
  headers:
    '{"ClientId": "%%CEPHEID_CLIENT_ID%%", "Content-Type": "application/json", "Authorization": "Bearer %%CEPHEID_ACCESS_TOKEN%%"}',
  payload:
    `{{square true}}` +
    `{{curly true}}` +
    // Required
    `"instrumentSerialNumber":{{enclose (defaultTo device.stickerInstrumentSerial '') with='"'}},` +
    `"gatewaySerialNumber":{{enclose (defaultTo result.instrumentSerial '') with='"'}},` +
    `"instrumentModel":{{enclose (defaultTo device.instrumentModel '') with='"'}},` +
    `"softwareVersion":{{enclose (defaultTo result.resultData.softwareVersion '') with='"'}},` +
    `"operatingSystem":{{enclose (defaultTo result.resultData.computerId '') with='"'}},` +
    `"labName":{{enclose (defaultTo site.name '') with='"'}},` +
    `"labGuid":{{enclose (defaultTo site.id '') with='"'}},` +
    `"labLocationCountry":{{enclose (defaultTo country.name '') with='"'}},` +
    `"labLocationRegion":{{enclose (defaultTo site.state '') with='"'}},` +
    `"labLocationDistrict":{{enclose (defaultTo site.lga '') with='"'}},` +
    `"institutionGuid":{{enclose (defaultTo site.id '') with='"'}},` +
    `"institutionName":{{enclose (defaultTo site.name '') with='"'}},` +
    `"testResultGuid":{{enclose (defaultTo result.id '') with='"'}},` +
    `"resultCategory":{{enclose (defaultTo result.resultOutcome '') with='"'}},` +
    `"reagentLotId":{{enclose (defaultTo result.resultData.reagentLotId '') with='"'}},` +
    `"sampleType":{{enclose (defaultTo result.resultData.sampleTypeKey 'ORH') with='"'}},` +
    `"data":{{enclose (defaultTo result.data '') with='"'}},` +
    `"moduleName":{{enclose (defaultTo result.resultData.moduleName '') with='"'}},` +
    `"startTime":{{urlEncode (defaultTo (getDateInMilliSeconds result.startedOn) 'null')}},` +
    `"endTime":{{urlEncode (defaultTo (getDateInMilliSeconds result.endedOn) 'null')}},` +
    `"testModifiedTime":{{urlEncode (defaultTo (getDateInMilliSeconds result.updatedOn) 'null')}},` +
    `"testCreationInInstrument":{{urlEncode (defaultTo (getDateInMilliSeconds result.createdOn) 'null')}},` +
    `"sampleId":{{enclose (defaultTo result.sample.id '') with='"'}},` +
    `"cartridgeSerialNumber":{{enclose (defaultTo result.resultData.cartridgeSerial '') with='"'}},` +
    `"moduleSerialNumber":{{enclose (defaultTo result.resultData.moduleSerial '') with='"'}},` +
    `"assayName":{{enclose (defaultTo result.assay.name '') with='"'}},` +
    `"assayGuid":{{enclose (defaultTo result.assay.id '') with='"'}},` +
    `"exportTime":{{urlEncode (defaultTo (getDateInMilliSeconds result.createdOn) 'null')}},` +
    `"icoreSerialNumber":{{result.resultData.icoreSerialNumber}},` +
    // Optional
    `"softwareType":{{enclose (defaultTo device.softwareType '') with='"'}},` +
    `"testType":{{enclose (defaultTo result.resultData.testType '') with='"'}},` +
    `"daisyChained":{{enclose (defaultTo device.daisyChained '') with='"'}},` +
    `"lisConnected":{{enclose (defaultTo device.lisConnected '') with='"'}},` +
    `"analytes":{{enclose (defaultTo result.resultData.analytes 'null') with=''}},` +
    `"errors":{{enclose (defaultTo result.resultData.errors 'null') with=''}},` +
    `"datagramFormat":{{enclose (defaultTo result.resultData.datagramFormat '') with='"'}},` +
    `"dataReductionAlgorithm":{{enclose (defaultTo result.resultData.dataReductionAlg '') with='"'}},` +
    `"adc2Psi":{{enclose (defaultTo result.resultData.adc2Psi '') with='"'}},` +
    `"orderTime":{{enclose (defaultTo result.resultData.orderTime '') with='"'}},` +
    `"firmwareVersion":{{enclose (defaultTo result.resultData.firmwareVersion '') with='"'}},` +
    `"status":{{enclose (defaultTo result.resultData.status '') with='"'}},` +
    `"errorStatus":{{enclose (defaultTo result.resultData.errorStatus '') with='"'}},` +
    `"moduleColor":{{enclose (defaultTo device.moduleColor '') with='"'}}` +
    `{{curly}}` +
    `{{square}}`,
  fileContentTypeId: 'applicationJson',
  okResponseSuccessRegex: '204',
}
