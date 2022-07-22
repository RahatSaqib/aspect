const { assert } = require('chai')
const { addExtraData } = require('../../src/dashboard/options')

describe('dashboard widgets alerts', () => {
  let widget = null

  beforeEach(() => {
    widget = {
      id: 19,
      title: 'GeneXpert Devices',
      titleI18nKey: 'geneXpertDevicesTitle',
      subTitle: null,
      subTitleI18nKey: null,
      link: '/browse/device',
      linkParams: {
        deviceName: 'GeneXpert',
      },
      externalId: 'geneXpertDevices',
      description: 'The number of approved GeneXpert devices (excluding decommissioned devices).',
      descriptionI18nKey: 'geneXpertDevices',
      dashboards: '{"operational": {"groupI18nKey": "summaryWidgetGroupConnectivity"}}',
      options: {},
      icon: 'MdDesktopWindows',
      statUnit: '{unit} last month',
      statUnitI18nKey: 'lastMonth',
      statStatus: null,
      statStatusI18nKey: null,
      extraUnit: null,
      extraUnitI18nKey: null,
      extraLabel: null,
      extraLabelI18nKey: null,
      dashboardWidgetId: 17,
      count: 54,
      unit: 53,
      extra: null,
    }
  })

  it('Should set alert to true when dependant field value is greater than the provided value', () => {
    const alert = {
      whenIs: 'greaterThan',
      dependsOn: 'count',
      comparedTo: 5,
      representing: 'numberOfGxDevices',
    }
    widget.options = {
      extraFields: {
        alert,
      },
    }

    addExtraData(widget)

    assert.deepEqual(widget.alert, {
      config: alert,
      display: true,
    })
  })

  it('Should set alert to true when dependant field value is greater than unit field value', () => {
    const alert = {
      whenIs: 'greaterThan',
      dependsOn: 'count',
      comparedTo: 'unit',
      representing: 'numberOfGxDevices',
    }
    widget.options = {
      extraFields: {
        alert,
      },
    }

    addExtraData(widget)

    assert.deepEqual(widget.alert, {
      config: alert,
      display: true,
    })
  })

  it("Should set alert to false when dependant field value isn't greater than unit field value", () => {
    const alert = {
      whenIs: 'greaterThan',
      dependsOn: 'count',
      comparedTo: 'unit',
      representing: 'numberOfGxDevices',
    }
    widget.unit = 100
    widget.options = {
      extraFields: {
        alert,
      },
    }

    addExtraData(widget)

    assert.deepEqual(widget.alert, {
      config: alert,
      display: false,
    })
  })

  it('Should set alert to true when dependant field value is less than the provided value', () => {
    const alert = {
      whenIs: 'lessThan',
      dependsOn: 'count',
      comparedTo: 100,
      representing: 'numberOfGxDevices',
    }
    widget.options = {
      extraFields: {
        alert,
      },
    }

    addExtraData(widget)

    assert.deepEqual(widget.alert, {
      config: alert,
      display: true,
    })
  })

  it('Should set alert to true when dependant field value is one of the provided collection', () => {
    const alert = {
      whenIs: 'containedIn',
      dependsOn: 'count',
      comparedTo: [1, 5, 6, 54],
      representing: 'numberOfGxDevices',
    }
    widget.options = {
      extraFields: {
        alert,
      },
    }

    addExtraData(widget)

    assert.deepEqual(widget.alert, {
      config: alert,
      display: true,
    })
  })

  it("Should set alert to false when dependant field value isn't one of the provided collection", () => {
    const alert = {
      whenIs: 'containedIn',
      dependsOn: 'count',
      comparedTo: [1, 5, 6, 10],
      representing: 'numberOfGxDevices',
    }
    widget.options = {
      extraFields: {
        alert,
      },
    }

    addExtraData(widget)

    assert.deepEqual(widget.alert, {
      config: alert,
      display: false,
    })
  })

  it('Should set alert to true when dependant field value is between range', () => {
    const alert = {
      whenIs: 'between',
      dependsOn: 'count',
      comparedTo: [1, 100],
      representing: 'numberOfGxDevices',
    }
    widget.options = {
      extraFields: {
        alert,
      },
    }

    addExtraData(widget)

    assert.deepEqual(widget.alert, {
      config: alert,
      display: true,
    })
  })

  it("Should set alert to false when dependant field value isn't between range", () => {
    const alert = {
      whenIs: 'between',
      dependsOn: 'count',
      comparedTo: [80, 100],
      representing: 'numberOfGxDevices',
    }
    widget.options = {
      extraFields: {
        alert,
      },
    }

    addExtraData(widget)

    assert.deepEqual(widget.alert, {
      config: alert,
      display: false,
    })
  })
})
