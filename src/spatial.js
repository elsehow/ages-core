'use strict';

const schema = require('./ages-schema')

function firstVal (obj) {
  return obj[
    Object.keys(obj)[0]
  ]
}

function wrapGet (cb) {
  return (err, res) => {
    if (err)
      return cb(err, res)
    return cb(err, firstVal(res))
  }
}

function wrapPut (cb) {
  return (err, res) => {
    if (err)
      return cb(err, res)
    return cb(err, res.value.v)
  }
}

// takes a hyperkv-like object `hkv`
function spatial (hkv) {

  function find (pl, cb) {
    hkv.get(pl, wrapGet(cb))
  }

  function describe (pl, desc, cb) {
    let p = schema.space(pl, desc)
    if (p) {
      hkv.put(pl, p, wrapPut(cb))
      return
    }
    cb(schema.error, null)
  }

  return {

    find: find,

    describe: describe,

    link: (pl1, pl2, cmd, cb) => {
      let lnk = {
        command: cmd,
        goesTo: pl2,
      }
      find(pl1, (err, p) => {
        if (err) {
          cb(err, p)
          return
        }
        if (p.edges) 
          p.edges.push(lnk)
        else
          p.edges = [lnk]
        let verified = schema.verify(p)
        if (!verified) {
          cb(schema.error, null)
          return
        }
        return hkv.put(pl1, p, wrapPut(cb))
      })
    },

    unlink: (pl, cmd, cb) => {
      find(pl, (err, p) => {
        if (err || !p.edges) 
          return cb(err, p)
        let filtered = p.edges.filter(e => {
          return e.command !== cmd
        })
        if (filtered.length == p.edges.length)
          return cb(`No such command "${cmd}" found at place "${pl}"`, pl)
        p.edges = filtered
        return hkv.put(pl, p, wrapPut(cb))
      })
    },

    createReadStream: () => {
    },
  }
}
module.exports = spatial
