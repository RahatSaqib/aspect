const _ = require('lodash')

const admin = {
  name: 'Admin',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_activity_per_assay',
    'device_activity_percent',
    'module_swaps',
    'device_utilization',
    'all_results',
    'xpert_test_activities_report',
    'device_utilization_per_day',
    'module_activity_report',
    'report_custom_fields_completion',
    'inventory_log',
    'tb_workload_summary',
  ],
  permissions: [
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'device',
      activity: 'edit',
    },
    {
      module: 'case',
      activity: 'edit',
    },
    {
      module: 'demo',
      activity: 'edit',
    },
    {
      module: 'person',
      activity: 'edit',
    },
    {
      module: 'result',
      activity: 'edit',
    },
    {
      module: 'router',
      activity: 'view',
    },
    {
      module: 'treatmentStatus',
      activity: 'edit',
    },
    {
      module: 'site',
      activity: 'admin',
    },
    {
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'dashboard',
      activity: 'summary',
    },
    {
      module: 'dashboard',
      activity: 'device',
    },
    {
      module: 'dashboard',
      activity: 'result',
    },
    {
      module: 'dashboard',
      activity: 'inventory',
    },
    {
      module: 'dashboard',
      activity: 'site',
    },
    {
      module: 'dashboard',
      activity: 'target',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'issue',
      activity: 'edit',
    },
    {
      module: 'reporter',
      activity: 'edit',
    },
    {
      module: 'task',
      activity: 'view',
    },
    {
      module: 'patient',
      activity: 'edit',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'taskMenu',
      activity: 'view',
    },
    {
      module: 'inventory',
      activity: 'edit',
    },
    {
      module: 'notification',
      activity: 'edit',
    },
    {
      module: 'deviceApiKey',
      activity: 'edit',
    },
    {
      module: 'report',
      activity: 'view',
    },
  ],
}

const manager = {
  name: 'Manager',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'module_swaps',
    'all_results',
    'device_utilization_per_day',
    'module_activity_report',
    'report_custom_fields_completion',
    'tb_workload_summary',
  ],
  permissions: [
    {
      module: 'dashboard',
      activity: 'device',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'case',
      activity: 'edit',
    },
    {
      module: 'device',
      activity: 'edit',
    },
    {
      module: 'inventory',
      activity: 'edit',
    },
    {
      module: 'person',
      activity: 'edit',
    },
    {
      module: 'reporter',
      activity: 'edit',
    },
    {
      module: 'site',
      activity: 'edit',
    },
    {
      module: 'dashboard',
      activity: 'inventory',
    },
    {
      module: 'dashboard',
      activity: 'report',
    },
    {
      module: 'dashboard',
      activity: 'site',
    },
    {
      module: 'dashboard',
      activity: 'summary',
    },
    {
      module: 'dashboard',
      activity: 'target',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'router',
      activity: 'view',
    },
  ],
}

const regionalOfficer = {
  name: 'Regional Officer',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'module_swaps',
    'all_results',
    'device_utilization_per_day',
    'module_activity_report',
    'report_custom_fields_completion',
    'tb_workload_summary',
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'deviceApiKey',
      activity: 'edit',
    },
    {
      module: 'inventory',
      activity: 'edit',
    },
    {
      module: 'notification',
      activity: 'edit',
    },
    {
      module: 'result',
      activity: 'edit',
    },
    {
      module: 'treatmentStatus',
      activity: 'edit',
    },
    {
      module: 'dashboard',
      activity: 'result',
    },
    {
      module: 'dashboard',
      activity: 'summary',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'device',
      activity: 'view',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'person',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'site',
      activity: 'view',
    },
    {
      module: 'task',
      activity: 'view',
    },
    {
      module: 'taskMenu',
      activity: 'view',
    },
    {
      module: 'assay',
      activity: 'view',
    },
  ],
}

const labUser = {
  name: 'Lab User',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'module_swaps',
    'all_results',
    'device_utilization_per_day',
    'module_activity_report',
    'tb_workload_summary',
  ],
  permissions: [
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'person',
      activity: 'view',
    },
    {
      module: 'device',
      activity: 'view',
    },
    {
      module: 'result',
      activity: 'edit',
    },
    {
      module: 'treatmentStatus',
      activity: 'edit',
    },
    {
      module: 'site',
      activity: 'view',
    },
    {
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'dashboard',
      activity: 'summary',
    },
    {
      module: 'dashboard',
      activity: 'result',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'task',
      activity: 'view',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'taskMenu',
      activity: 'view',
    },
    {
      module: 'inventory',
      activity: 'view',
    },
    {
      module: 'notification',
      activity: 'view',
    },
    {
      module: 'deviceApiKey',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
  ],
}

const clinician = {
  name: 'Clinician',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'module_swaps',
    'all_results',
    'device_utilization_per_day',
    'module_activity_report',
    'tb_workload_summary',
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'case',
      activity: 'edit',
    },
    {
      module: 'result',
      activity: 'edit',
    },
    {
      module: 'treatmentStatus',
      activity: 'edit',
    },
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'person',
      activity: 'view',
    },
    {
      module: 'device',
      activity: 'view',
    },
    {
      module: 'site',
      activity: 'view',
    },
    {
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'dashboard',
      activity: 'summary',
    },
    {
      module: 'dashboard',
      activity: 'inventory',
    },
    {
      module: 'dashboard',
      activity: 'site',
    },
    {
      module: 'dashboard',
      activity: 'target',
    },
    {
      module: 'dashboard',
      activity: 'result',
    },
    {
      module: 'dashboard',
      activity: 'device',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'task',
      activity: 'view',
    },
    {
      module: 'taskMenu',
      activity: 'view',
    },
    {
      module: 'inventory',
      activity: 'view',
    },
    {
      module: 'router',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
  ],
}

const deviceMaker = {
  name: 'Device Maker',
  reports: [
    'critical_errors_by_device',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'device_utilization_per_day',
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'inventory',
      activity: 'view',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'site',
      activity: 'view',
    },
  ],
}

const ntp = {
  name: 'NTP',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'module_swaps',
    'all_results',
    'device_utilization_per_day',
    'module_activity_report',
    'report_custom_fields_completion',
    'tb_workload_summary',
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
  ],
}

const ntpNoResults = {
  name: 'NTP - No Results',
  reports: [
    'critical_errors_by_device',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'device_utilization_per_day',
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
  ],
}

const technician = {
  name: 'Technician',
  reports: [
    'critical_errors_by_device',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'device_utilization_per_day',
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'site',
      activity: 'view',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'device',
      activity: 'view',
    },
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'deviceApiKey',
      activity: 'edit',
    },
    {
      module: 'browse',
      activity: 'view',
    },
  ],
}

const donor = {
  name: 'Donor',
  reports: [
    'critical_errors_by_device',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'device_utilization_per_day',
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'inventory',
      activity: 'view',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'site',
      activity: 'view',
    },
  ],
}

const resultViewerNo = {
  name: 'Result Viewer - No',
  reports: [
    'critical_errors_by_device',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'device_utilization_per_day',
  ],
  permissions: [
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'reporter',
      activity: 'view',
    },
    {
      module: 'site',
      activity: 'view',
    },
    {
      module: 'task',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
  ],
}

const resultViewerYes = {
  name: 'Result Viewer - Yes',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'module_swaps',
    'all_results',
    'device_utilization_per_day',
    'module_activity_report',
    'report_custom_fields_completion',
  ],
  permissions: [
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'reporter',
      activity: 'view',
    },
    {
      module: 'result',
      activity: 'view',
    },
    {
      module: 'site',
      activity: 'view',
    },
    {
      module: 'task',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
  ],
}

const remoteHealthWorker = {
  name: 'Remote Health Worker',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'all_results',
  ],
  permissions: [
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'device',
      activity: 'view',
    },
    {
      module: 'person',
      activity: 'view',
    },
    {
      module: 'result',
      activity: 'edit',
    },
    {
      module: 'treatmentStatus',
      activity: 'edit',
    },
    {
      module: 'site',
      activity: 'view',
    },
    {
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'dashboard',
      activity: 'summary',
    },
    {
      module: 'dashboard',
      activity: 'inventory',
    },
    {
      module: 'dashboard',
      activity: 'report',
    },
    {
      module: 'dashboard',
      activity: 'site',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'reporter',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
  ],
}

const labManager = {
  name: 'Lab Manager',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'module_swaps',
    'all_results',
    'device_utilization_per_day',
    'module_activity_report',
    'report_custom_fields_completion',
    'tb_workload_summary',
  ],
  permissions: [
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'device',
      activity: 'edit',
    },
    {
      module: 'person',
      activity: 'view',
    },
    {
      module: 'result',
      activity: 'edit',
    },
    {
      module: 'treatmentStatus',
      activity: 'edit',
    },
    {
      module: 'site',
      activity: 'edit',
    },
    {
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'dashboard',
      activity: 'summary',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'inventory',
      activity: 'edit',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'task',
      activity: 'view',
    },
  ],
}

const labSupervisor = {
  name: 'Lab Supervisor',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'module_swaps',
    'all_results',
    'device_utilization_per_day',
    'module_activity_report',
    'report_custom_fields_completion',
    'tb_workload_summary',
  ],
  permissions: [
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'device',
      activity: 'view',
    },
    {
      module: 'person',
      activity: 'view',
    },
    {
      module: 'result',
      activity: 'edit',
    },
    {
      module: 'treatmentStatus',
      activity: 'edit',
    },
    {
      module: 'site',
      activity: 'view',
    },
    {
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'dashboard',
      activity: 'summary',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'inventory',
      activity: 'edit',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'task',
      activity: 'view',
    },
  ],
}

const medTech = {
  name: 'Med Tech',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'module_swaps',
    'all_results',
    'device_utilization_per_day',
    'tb_workload_summary',
  ],
  permissions: [
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'device',
      activity: 'view',
    },
    {
      module: 'person',
      activity: 'view',
    },
    {
      module: 'result',
      activity: 'edit',
    },
    {
      module: 'treatmentStatus',
      activity: 'edit',
    },
    {
      module: 'site',
      activity: 'view',
    },
    {
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'dashboard',
      activity: 'summary',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'inventory',
      activity: 'edit',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'task',
      activity: 'view',
    },
  ],
}

const dataViewer = {
  name: 'Data Viewer',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'module_swaps',
    'all_results',
    'device_utilization_per_day',
    'module_activity_report',
    'tb_workload_summary',
  ],
  permissions: [
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'device',
      activity: 'view',
    },
    {
      module: 'person',
      activity: 'view',
    },
    {
      module: 'result',
      activity: 'view',
    },
    {
      module: 'treatmentStatus',
      activity: 'view',
    },
    {
      module: 'site',
      activity: 'view',
    },
    {
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'dashboard',
      activity: 'summary',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'task',
      activity: 'view',
    },
  ],
}

const systemOne = {
  ...admin,
  name: 'SystemOne',
}

const labAdmin = {
  name: 'Lab Admin',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'module_swaps',
    'all_results',
    'device_utilization_per_day',
    'module_activity_report',
    'report_custom_fields_completion',
    'tb_workload_summary',
  ],
  permissions: [
    {
      module: 'device',
      activity: 'edit',
    },
    {
      module: 'result',
      activity: 'edit',
    },
    {
      module: 'site',
      activity: 'edit',
    },
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'browse',
      activity: 'view',
    },
  ],
}

const concatUniqOrderedArray = (arr1, arr2, sortedFunction = _.identity) =>
  _.compact(_.sortBy(_.uniq(_.concat(arr1, arr2)), arr1 && arr2 ? sortedFunction : _.identity))

const mergeJobFunctions = (jf1, jf2) => {
  if (jf1.name && jf2.name && jf1.name !== jf2.name) throw new Error('The jobfunction names should be equals')
  const plainObject = _.merge({}, _.omit(jf1, ['reports', 'permissions']), _.omit(jf2, ['reports', 'permissions']))
  const reports = concatUniqOrderedArray(jf1.reports, jf2.reports)
  const permissions = concatUniqOrderedArray(jf1.permissions, jf2.permissions, obj => [obj.module, obj.activity])

  const finalJobFunction = { ...plainObject }

  const modulesToNotReduce = ['dashboard']

  if (reports.length) finalJobFunction.reports = reports
  if (permissions.length)
    finalJobFunction.permissions = _.reduce(
      permissions,
      (result, curr) => {
        const lastPermission = _.last(result)
        if (!lastPermission) result.push(curr)
        else if (modulesToNotReduce.includes(lastPermission.module) || lastPermission.module !== curr.module)
          result.push(curr)
        return result
      },
      []
    )

  return finalJobFunction
}

/**
 * Builds a new version of the provided job function with the addition of country specific reports
 * @param {Object} jobFunction The base job function to decorate
 * @param {Array} countryReports The country reports external ids
 * @returns The job function including the additional reports
 */
const countryReportsDecorator = (jobFunction = {}, countryReports) => ({
  ...jobFunction,
  reports: [...(jobFunction.reports || []), ...countryReports],
})

module.exports = {
  admin,
  regionalOfficer,
  labUser,
  clinician,
  deviceMaker,
  ntp,
  technician,
  donor,
  manager,
  resultViewerNo,
  resultViewerYes,
  remoteHealthWorker,
  labManager,
  labSupervisor,
  medTech,
  dataViewer,
  ntpNoResults,
  systemOne,
  labAdmin,
  mergeJobFunctions,
  countryReportsDecorator,
}
