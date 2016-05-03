// TODO real database management in the future as wel, with level+configruable db location
// TODO ~/.ages by default i figure
module.exports = () => {
  const hyperkv = require('hyperkv')
  const hyperlog = require('hyperlog')
  const memdb = require('memdb')
  const log = hyperlog(memdb(), { valueEncoding: 'json' })
  return hyperkv({
    log: log,
    db: memdb(),
  })
}
