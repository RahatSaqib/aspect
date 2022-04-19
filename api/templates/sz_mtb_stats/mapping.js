module.exports = [
  {
    // Monthly stats to be collated for GeneExpert section
    // > MTB section
    G5: 'mtbDetected',
    G6: 'mtbNotDetected',
    G7: 'mtbValid',
    G8: 'percentMtbDetected',
    G9: 'mtbInvalid',
    G10: 'mtbNoResult',
    G11: 'mtbError',
    G12: 'mtbInconclusive', // invalid, errors, no results
    G13: 'total',
    G14: 'percentMtbError',
    
    // > RIF section
    G16: 'totalRif',
    G17: 'mtbDetectedRifDetected',
    G18: 'mtbDetectedRifNotDetected',
    G19: 'mtbDetectedRifIndeterminate',
    G20: 'percentRifDetected',
    G21: 'avgTestsPerModule',
    G22: 'avgTestsPerDay',

    A27: 'total',
    B27: 'mtbNotDetected',
    C27: 'mtbDetectedRifNotDetected',
    D27: 'mtbDetectedRifDetected',
    E27: 'mtbTraceDetected',
    F27: 'mtbInvalid',
  }
]
