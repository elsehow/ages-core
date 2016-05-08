const hyperkv = require('hyperkv')
const hyperlog = require('hyperlog')
const sub = require('subleveldown')

module.exports = (path) => {
  var db = null
  if (path)
    db = require('level')(path)
  else
    db = require('memdb')()
  const log = hyperlog(sub(db, 'log'), { valueEncoding: 'json' })
  return hyperkv({
      log: log,
    db: sub(db, 'kv'),
  })
}
