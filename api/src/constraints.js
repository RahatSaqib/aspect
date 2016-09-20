let _ = require('lodash')
let {query} = require('./db')

function getConstraints(username){
  return query('Get constraints for username')
    .from('data_filter as f')
    .innerJoin('role as r', 'f.id', 'r.data_filter_id')
    .innerJoin('user_role as ur', 'r.id', 'ur.role_id')
    .innerJoin('user as u', 'ur.user_id', 'u.id')
    .where({'u.name': username})
    .select('f.constraint')
    .map(f => JSON.parse(f.constraint))
}

function addConstraints(queryBuilder, dataConstraints, aliases = {state: 'state', lga: 'lga'}){
  if(!dataConstraints || !dataConstraints.length){
    return
  }

  queryBuilder.where(function(){
    for(let constraint of dataConstraints){
      if(constraint.state){
        this.orWhere(_.mapKeys(constraint.state, (v, k) => `${aliases.state}.${k}`))
      }

      if(constraint.lga){
        this.orWhere(_.mapKeys(constraint.lga, (v, k) => `${aliases.lga}.${k}`))
      }
    }
  })
}

module.exports = {
  getConstraints,
  addConstraints
}
