const basicResultPayload = {
  result: {
    id: 'UNIQUE-RESULT-ID',
    assay: {
      id: 'GxMtbRifUltra',
      version: '2',
    },
    instrument: {
      serial: '123456799',
      module: {
        serial: '654321',
        name: 'A1',
      },
    },
    sender: {
      version: '4.7b',
      operator: 'A GeneXpert User',
    },
    patient: {
      id: '0833223622',
      name: 'Peta J',
      surname: 'McAllister',
      address: '22 Marble Road, Greenstone Hill',
      age: 25,
      gender: 'Female',
      phone: '0833243682',
    },
    sample: { id: 'PKM0833243689' },
    data: {
      probeData: {},
      assay: 'Xpert MTB-RIF Ultra',
      customFieldData: {
        1: {
          notAvailable: false,
          label: 'HIV Status',
          value: 'Unknown',
        },
        2: {
          notAvailable: false,
          label: 'Visual Analysis',
          value: 'Blood Stained',
        },
      },
    },
  },
}

module.exports = {
  basicResultPayload,
}
