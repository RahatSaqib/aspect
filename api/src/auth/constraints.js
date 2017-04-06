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
          constraint.lga = { id: context.lgaId }
        } else if (context.stateId != null) {
          constraint.state = { id: context.stateId }
        } else if (context.countryId != null) {
          constraint.country = { id: context.countryId }
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
  let { site, partner, geography, country, state, lga } = aliases
  const { device, sample } = aliases

  // TODO generalize constraint building
  // TODO only join queries if needed within constraints or required by unspecified aliases
  // ====== device aliases begin ======
  if (device) {
    if (!site) {
      site = alias('Site')
      queryBuilder.leftOuterJoin(`Site as ${site}`, `${device}.siteId`, `${site}.id`)
    }
  }
  // ====== device aliases end ======

  // ====== site aliases begin ======
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
  // ====== site aliases end ======

  // ====== geography aliases begin ======
  if (geography) {
    if (!country) {
      country = alias('Country')
      queryBuilder.leftOuterJoin(`Country as ${country}`, `${geography}.countryId`, `${country}.id`)
    }

    if (!state) {
      state = alias('State')
      queryBuilder.leftOuterJoin(`State as ${state}`, `${geography}.stateId`, `${state}.id`)
    }

    if (!lga) {
      lga = alias('Lga')
      queryBuilder.leftOuterJoin(`Lga as ${lga}`, `${geography}.lgaId`, `${lga}.id`)
    }
  }
  // ====== geography aliases end ======

  // Partner, country, and constraints are ANDed
  if (partner && constraints.partner) {
    queryBuilder.where(function () {
      this.whereNull(`${partner}.id`).orWhere({ [`${partner}.id`]: constraints.partner.id })
    })
  }
  if (country && constraints.country) {
    queryBuilder.where({ [`${country}.id`]: constraints.country.id })
  }

  // data filter constraints are ORed
  if (constraints.$or && constraints.$or.length) {
    queryBuilder.where(function () {
      for (const constraint of constraints.$or) {
        if (state && constraint.state) {
          this.orWhere(_.mapKeys(constraint.state, (v, k) => `${state}.${k}`))
        }

        if (lga && constraint.lga) {
          this.orWhere(_.mapKeys(constraint.lga, (v, k) => `${lga}.${k}`))
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

module.exports = {
  getConstraints,
  addConstraints
}
