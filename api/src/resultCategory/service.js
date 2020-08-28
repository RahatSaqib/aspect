function getPositiveCategoriesExternalIds() {
    // TODO: Do it at DB, maybe adding a flag for knowing if the result category represents a positive result or it doesn't
    return [
        'Detected',
        'Trace Detected',
        'MoreThan40',
        'MoreThan150',
        'MoreThan550',
        'MoreThan1000',
        'LessThan40',
        'LessThan150',
        'LessThan550',
        'LessThan1000',
        'Resistant',
        'Positive1',
        'Positive2',
        'Positive3',
        'Scanty',
        'PositiveMOTT',
        'PositiveMTB',
        'Positive',
    ]
}

module.exports = getPositiveCategoriesExternalIds