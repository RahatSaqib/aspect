const { EXTERNAL_IDS } = require('../../src/shared/constants')

module.exports = {
  externalId: EXTERNAL_IDS.SEND_RESULT_TO_CEPHEID,
  method: 'POST',
  url: `https://datareceiver-dev.stg.c360.cepheid.com/datareceiver/api/v1/{{urlEncode result.instrumentSerial}}/instrumentTests`,
  payload:
    `{{square true}}` +
    `{{curly true}}` +
    `"instrumentSerialNumber":{{enclose (defaultTo result.instrumentSerial '') with='"'}},` + // required
    `"gatewaySerialNumber":{{enclose (defaultTo result.resultData.gxConnectVersion '') with='"'}},` + // required
    `"instrumentModel":{{enclose (defaultTo device.instrumentModel '') with='"'}},` + // required
    `"softwareVersion":{{enclose (defaultTo result.resultData.softwareVersion '') with='"'}},` + // required
    `"operatingSystem":{{enclose (defaultTo result.resultData.computerId '') with='"'}},` + // required
    `"labName":{{enclose (defaultTo site.name '') with='"'}},` + // required
    `"labGuid":{{enclose (defaultTo site.id '') with='"'}},` + // required
    `"labLocationCountry":{{enclose (defaultTo country.name '') with='"'}},` + // required
    `"labLocationRegion":{{enclose (defaultTo site.state '') with='"'}},` + // required
    `"labLocationDistrict":{{enclose (defaultTo site.lga '') with='"'}},` + // required
    `"institutionGuid":{{enclose (defaultTo site.id '') with='"'}},` + // required
    `"institutionName":{{enclose (defaultTo site.name '') with='"'}},` + // required
    `"testResultGuid":{{enclose (defaultTo result.id '') with='"'}},` + // required
    `"resultCategory":{{enclose (defaultTo result.resultOutcome '') with='"'}},` + // required
    `"reagentLotId":{{enclose (defaultTo result.resultData.reagentLotId '') with='"'}},` + // required
    `"sampleType":{{enclose (defaultTo result.sampleExternalId 'ORH') with='"'}},` + // required
    `"softwareType":{{enclose (defaultTo device.softwareType '') with='"'}},` + // required
    `"data":{{enclose (defaultTo result.data '') with='"'}},` +
    `"moduleName":{{enclose (defaultTo result.resultData.moduleName '') with='"'}},` + // required
    `"startTime":{{urlEncode (defaultTo (getDateInMiliSeconds result.startedOn) 'NULL')}},` + // required
    `"endTime":{{urlEncode (defaultTo (getDateInMiliSeconds result.endedOn) 'NULL')}},` + // required
    `"testModifiedTime":{{urlEncode (defaultTo (getDateInMiliSeconds result.updatedOn) 'NULL')}},` + // required
    `"testCreationInInstrument":{{urlEncode (defaultTo (getDateInMiliSeconds result.createdOn) 'NULL')}},` + // required
    `"sampleId":{{enclose (defaultTo result.sample.id '') with='"'}},` + // required
    `"cartridgeSerialNumber":{{enclose (defaultTo result.resultData.cartridgeSerial '') with='"'}},` + // required
    `"moduleSerialNumber":{{enclose (defaultTo result.resultData.moduleSerial '') with='"'}},` + // required
    `"assayName":{{enclose (defaultTo result.assay.name '') with='"'}},` + // required
    `"assayGuid":{{enclose (defaultTo result.assay.id '') with='"'}},` + // required
    `"daisyChained":{{enclose (defaultTo device.daisyChained false) with='"'}},` +
    `"lisConnected":{{enclose (defaultTo device.lisConfiguredCorrectly false) with='"'}},` +
    `"errors": {{square true}}` +
    `{{curly true}}` +
    `"errorCode":{{enclose (defaultTo result.errorCode '') with='"'}},` +
    `"details":{{enclose (defaultTo result.errorNotes '') with='"'}}` +
    `{{curly}}` +
    `{{square}},` +
    // TODO: Need to Map these value because these values doesn't exist in Apect right nowW
    `"testType":"SPECIMEN"` + // required
    // `"datagramFormat":"2",` +
    // `"dataReductionAlgorithm":"3",` +
    // `"icoreSerialNumber":"ICORE123",` +
    // `"adc2Psi":0.5,` +
    // `"errorStatus":"OK",` +
    // `"moduleColor":"6-Color",` +
    // `"orderTime":1645510800000,` +
    // `"exportTime":1645514400000,` +
    // `"firmwareVersion":"2.5.0",` +
    // `"status":2` +
    //  "analytes": [{
    // "analyteIndex": 1,
    // "analyteName": "Analyte 1",
    // "reporterName": null,
    // "curveFitResult": null,
    // "cycleThreshold": 0,
    // "deltaCt": null,
    // "ecResult": null,
    // "endpoint": 0,
    // "errorStatus": null,
    // "icResult": null,
    // "interpretation": null,
    // "iqsHqResult": null,
    // "iqsLqResult": null,
    // "meltPeakHeight": null,
    // "meltPeakTemperature": null,
    // "probeCheckReading1": 0
    // "probeCheckReading2": 0,
    // "probeCheckReading3": 0,
    // "probeCheckResult": null,
    // "quantitativeResult": null,
    // "secondDerivPeakHeight": 0,
    // "spcResult": null,
    // "targetResult": null,
    // "threshold": 0,
    // "timeToPossibility": 0,
    // "normalizationFactor": null
    // }],
    // "errors": [{
    // "errorCode": 5007,
    // "details": "Error details",
    // "logTime": 1645954800000,
    // "param1": 1,
    // "param2": 2,
    // "param3": 3,
    // "param4": 4,
    // "severity": 2,
    // "textParam": "text",
    // "type": 1
    // }]
    `{{curly}}` +
    `{{square}}`,
  fileContentTypeId: 'applicationJson',
}
