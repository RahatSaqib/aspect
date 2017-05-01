const _ = require('lodash')
const { knex } = require('../db')
const { getUser } = require('./service')

// A prefix for joined table aliases intended to avoid
// conflict with caller supplied table aliases
const ALIAS_PREFIX = '__constraints'
function alias(table) {
  return `${ALIAS_PREFIX}_${table}`
}

function getConstraints(credentials) {
  return getUser(credentials.name).then((user) => {
    const constraints = {
      partner: {
        id: user.partnerId
      },
      country: {
        id: user.countryId
      }
    }

    const jobContextsQ = knex('JobContext as jc')
      .leftJoin('Site as s', 'jc.siteId', 's.id')
      .leftJoin('Geography as g', 'jc.geographyId', 'g.id')
      .innerJoin('Job as j', 'jc.jobId', 'j.id')
      .innerJoin('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
      .innerJoin('Person as ps', 'j.personId', 'ps.id')
      .where({
        'ps.userId': user.id,
        'jf.partnerId': user.partnerId
      })
      .select('s.id as siteId', 'g.countryId', 'g.stateId', 'g.lgaId')

    return jobContextsQ.then((jobContexts) => {
      const filterConstraints = jobContexts.map((context) => {
        const constraint = {}

        // constrain to most specific site/geography
        // works because all geographies include higher levels
        if (context.siteId != null) {
          constraint.site = { id: context.siteId }
        } else if (context.lgaId != null) {
          constraint.geography = { lgaId: context.lgaId }
        } else if (context.stateId != null) {
          constraint.geography = { stateId: context.stateId }
        } else if (context.countryId != null) {
          constraint.geography = { countryId: context.countryId }
        }
        return constraint
      })
      if (filterConstraints.length) {
        constraints.$or = filterConstraints
      }
      return constraints
    })
  })
}

function addConstraints(queryBuilder, constraints, aliases) {
  let { partner, geography, site } = aliases
  const { device, sample } = aliases

  // TODO generalize constraint building
  // TODO only join queries if needed within constraints or required by unspecified aliases
  if (device) {
    if (!site) {
      site = alias('Site')
      queryBuilder.leftOuterJoin(`Site as ${site}`, `${device}.siteId`, `${site}.id`)
    }
  }

  if (site) {
    if (!partner) {
      partner = alias('Partner')
      queryBuilder.leftOuterJoin(`Partner as ${partner}`, `${site}.partnerId`, `${partner}.id`)
    }

    if (!geography) {
      geography = alias('Geography')
      queryBuilder.leftOuterJoin(`Geography as ${geography}`, `${site}.geographyId`, `${geography}.id`)
    }
  }

  // Partner, country, and constraints are ANDed
  if (partner && constraints.partner) {
    queryBuilder.where(function () {
      this.whereNull(`${partner}.id`).orWhere({ [`${partner}.id`]: constraints.partner.id })
    })
  }
  if (geography && constraints.country) {
    queryBuilder.where({ [`${geography}.countryId`]: constraints.country.id })
  }

  // data filter constraints are ORed
  if (constraints.$or && constraints.$or.length) {
    queryBuilder.where(function () {
      for (const constraint of constraints.$or) {
        if (geography && constraint.geography) {
          this.orWhere(_.mapKeys(constraint.geography, (v, k) => `${geography}.${k}`))
        }

        if (site && constraint.site) {
          this.orWhere(_.mapKeys(constraint.site, (v, k) => `${site}.${k}`))
        }

        if (device && constraint.device) {
          this.orWhere(_.mapKeys(constraint.device, (v, k) => `${device}.${k}`))
        }

        if (sample && constraint.sample) {
          this.orWhere(_.mapKeys(constraint.sample, (v, k) => `${sample}.${k}`))
        }
      }
    })
  }
}

// check for user permissions, pass in auth

function canView(auth, flag) {
  return _.some(auth.credentials.permissions, _.unary(_.partialRight(_.includes, flag)))
}

function canViewSites(auth) {
  return canView(auth, 'site:')
}

function canViewDevices(auth) {
  return canView(auth, 'device:')
}

function canViewResults(auth) {
  return canView(auth, 'result:')
}

module.exports = {
  getConstraints,
  addConstraints,
  canViewSites,
  canViewDevices,
  canViewResults
}
