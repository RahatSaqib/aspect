let _ = require('lodash')
let {query, knex} = require('../db')

// A prefix for joined table aliases intended to avoid
// conflict with caller supplied table aliases
const ALIAS_PREFIX = '__constraints'
function alias(table){
  return `${ALIAS_PREFIX}_${table}`
}

function getConstraints(credentials){
  // FIXME only include roles that assign permissions of interest
  let dataFilters = query('Get constraints for user credentials')
    .from('data_filter as f')
    .innerJoin('role as r', 'f.id', 'r.data_filter_id')
    .innerJoin('user_role as ur', 'r.id', 'ur.role_id')
    .where({
      'ur.user_id': credentials.id,
      'r.partner_id': credentials.partnerId
    })
    .select('f.constraint')
    .map(f => JSON.parse(f.constraint))

  let topOrgUnit = query('Get top org unit for user credentials')
    .from('org_unit as o')
    .innerJoin('role as r', 'o.id', 'r.org_unit_id')
    .innerJoin('user_role as ur', 'r.id', 'ur.role_id')
    .where({
      'ur.user_id': credentials.id,
      'r.partner_id': credentials.partnerId
    })
    .orderBy('o.depth')
    .first('o.id')

  return Promise.all([dataFilters, topOrgUnit])
    .then(([filterConstraints, orgUnit]) => {
      // TODO define constraints schema
      let constraints =  {
        partner: {
          id: credentials.partnerId
        },
        country: {
          id: credentials.countryId
        }
      }

      if(orgUnit){
        constraints.orgUnit = {
          id: orgUnit.id
        }
      }

      if(filterConstraints.length){
        constraints.$or = filterConstraints
      }

      return constraints
    })
}

function addConstraints(queryBuilder, constraints, aliases){
  let {device, site, partner, orgUnit, country, state, lga} = aliases

  // TODO generalize constraint building
  // TODO only join queries if needed within constraints or required by unspecified aliases
  if(!site){
    if(!device){
      throw new Error('Must provide either site or device alias or modify this to accept provided aliases')
    }
    site = alias('site')
    queryBuilder.leftOuterJoin(`site as ${site}`, `${device}.site_id`, `${site}.id`)
  }

  if(!partner){
    partner = alias('partner')
    queryBuilder.leftOuterJoin(`partner as ${partner}`, `${site}.partner_id`, `${partner}.id`)
  }

  if(!orgUnit){
    orgUnit = alias('org_unit')
    queryBuilder.leftOuterJoin(`org_unit as ${orgUnit}`, `${site}.org_unit_id`, `${orgUnit}.id`)
  }

  if(!country){
    country = alias('country')
    queryBuilder.leftOuterJoin(`country as ${country}`, `${site}.country_id`, `${country}.id`)
  }

  if(!state){
    state = alias('state')
    queryBuilder.leftOuterJoin(`state as ${state}`, `${site}.state_id`, `${state}.id`)
  }

  if(!lga){
    lga = alias('lga')
    queryBuilder.leftOuterJoin(`lga as ${lga}`, `${site}.lga_id`, `${lga}.id`)
  }

  // Partner, country, and org unit constraints are ANDed
  queryBuilder.where({[`${partner}.id`]: constraints.partner.id})
  queryBuilder.where({[`${country}.id`]: constraints.country.id})

  if(constraints.orgUnit){
    // find all org units below topmost granted org unit
    // TODO likely makes sense to move nested set hierarchy queries to it's own helper function
    let orgUnitSubOne = alias('org_unit_sub_1')
    let orgUnitSubTwo = alias('org_unit_sub_2')
    let orgUnitSubquery = query('Select org_unit hierachy for constraints')
      .from(`org_unit as ${orgUnitSubOne}`)
      .innerJoin(`org_unit as ${orgUnitSubTwo}`,
        knex.raw(`${orgUnitSubTwo}.left_bound BETWEEN ${orgUnitSubOne}.left_bound AND ${orgUnitSubOne}.right_bound`))
      .where({
        [`${orgUnitSubOne}.id`]: constraints.orgUnit.id,
        [`${orgUnitSubTwo}.partner_id`]: constraints.partner.id
      }).select(`${orgUnitSubTwo}.id`)
    queryBuilder.whereIn(`${orgUnit}.id`, orgUnitSubquery)
  }

  // data filter constraints are ORed
  if(constraints.$or && constraints.$or.length){
    queryBuilder.where(function(){
      for(let constraint of constraints.$or){
        if(constraint.state){
          this.orWhere(_.mapKeys(constraint.state, (v, k) => `${state}.${k}`))
        }

        if(constraint.lga){
          this.orWhere(_.mapKeys(constraint.lga, (v, k) => `${lga}.${k}`))
        }
      }
    })
  }
}

module.exports = {
  getConstraints,
  addConstraints
}
