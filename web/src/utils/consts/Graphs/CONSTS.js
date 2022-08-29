const GRAPH_CONSTS = {
  weekend: 'weekend',
  blockSize: {
    width: 20,
    height: 18,
    marginWidth: 5,
  },
  totalBlockSize: {
    width: 70,
  },
  treatmentStatus: {
    NotConfirmed: 'AwaitingTreatment',
    Confirmed: 'OnTreatment',
  },

  // this flag(s) should correspond with GRAPH_FLAGS in API in `api/src/shared/constants.js`
  GET_TOTAL_RESULTS: 'GET_TOTAL_RESULTS',
}

export default GRAPH_CONSTS
