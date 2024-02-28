const { EXTERNAL_IDS } = require('../../src/shared/constants')

module.exports = {
  externalId: EXTERNAL_IDS.SEND_RESULT_TO_CEPHEID,
  method: 'POST',
  url: `https://datareceiver-dev.stg.c360.cepheid.com/datareceiver/api/v1/{{urlEncode result.instrumentSerial}}/instrumentTests`,
  payload:
    `{{curly true}}` +
    `"instrumentSerialNumber":{{enclose (defaultTo result.instrumentSerial '') with='"'}},` +
    `"gatewaySerialNumber":{{enclose (defaultTo result.resultData.gxConnectVersion '') with='"'}},` +
    `"instrumentModel":{{enclose (defaultTo result.resultModuleName '') with='"'}},` + // NO
    `"softwareVersion":{{enclose (defaultTo result.resultData.softwareVersion '') with='"'}},` +
    `"operatingSystem":{{enclose (defaultTo result.resultData.computerId '') with='"'}},` +
    `"labName":{{enclose (defaultTo site.name '') with='"'}},` +
    `"labGuid":{{enclose (defaultTo site.id '') with='"'}},` +
    `"labLocationCountry":{{enclose (defaultTo country.name '') with='"'}},` +
    `"labLocationRegion":{{enclose (defaultTo site.state '') with='"'}},` +
    `"labLocationDistrict":{{enclose (defaultTo site.lga '') with='"'}},` +
    `"testResultGuid":{{enclose (defaultTo result.id '') with='"'}},` +
    `"resultCategory":{{enclose (defaultTo result.resultOutcome '') with='"'}},` +
    `"reagentLotId":{{enclose (defaultTo result.resultData.reagentLotId '') with='"'}},` +
    `"sampleType":{{enclose (defaultTo result.sampleExternalId '') with='"'}},` +
    `"data":{{enclose (defaultTo result.data '') with='"'}},` +
    `"moduleName":{{enclose (defaultTo result.resultData.moduleName '') with='"'}},` +
    `"startTime":{{enclose (defaultTo result.resultStartedOn '') with='"'}},` +
    `"endTime":{{enclose (defaultTo result.resultEndedOn '') with='"'}},` +
    `"testModifiedTime":{{enclose (defaultTo result.resultUpdatedOn '') with='"'}},` +
    `"testCreationInInstrument":{{enclose (defaultTo result.resultCreatedOn '') with='"'}},` +
    `"sampleId":{{enclose (defaultTo result.sample.id '') with='"'}},` +
    `"cartridgeSerialNumber":{{enclose (defaultTo result.cartridgeSerial '') with='"'}},` +
    `"moduleSerialNumber":{{enclose (defaultTo result.resultData.moduleSerial '') with='"'}},` +
    `"datagramFormat":2,` +
    `"dataReductionAlgorithm":"3",` +
    `"icoreSerialNumber":"ICORE123",` +
    `"adc2Psi":0.5,` +
    `"errorStatus":"OK",` +
    `"moduleColor":"6-Color",` +
    `"lisConnected":true,` +
    `"daisyChained":false,` +
    `"institutionGuid":"123456789",` +
    `"institutionName":"Example Hospital",` +
    `"orderTime":1645510800000,` +
    `"exportTime":1645514400000,` +
    `"firmwareVersion":"2.5.0",` +
    `"status":2` +
    `{{curly}}`,
  fileContentTypeId: 'applicationJson',
}
