'use strict'
let test = require('tape')
let spatial = require('../src/spatial.js')
function makeHyperkv () {
  let hyperlog = require('hyperlog')
  let memdb = require('memdb')
  let hyperkv = require('hyperkv')
  let log = hyperlog(memdb(), {
    valueEncoding: 'json'
  })
  return hyperkv({
    log: log,
    db: memdb(),
  })
}
let placeName1 =  'a quiet library'
let placeDesc1 = 'a book sits on a pedestal'
let placeName2 =  'a quiet island dock'
let placeDesc2 = 'warm water'
let command = 'fall through the book'
test('can make a new hyperkv', t => {
  let kv = makeHyperkv()
  t.ok(kv)
  t.ok(kv.get)
  t.ok(kv.put)
  t.ok(kv.createReadStream)
  kv.put('sup', {wow:'nice'}, (err, res) => {
    t.notOk(err)
    t.ok(res)
    t.end()
  })
})

test('can make a new spatial instance', t => {
  let sp = spatial(makeHyperkv())
  t.ok(sp.find)
  t.ok(sp.describe)
  t.ok(sp.link)
  t.ok(sp.unlink)
  t.ok(sp.createReadStream)
  t.end()
})


// that it works as it should ----------------------------------------------------

test('can describe, then find, a location', t => {
  let sp = spatial(makeHyperkv())
  function tryCb (err, res) {
    t.notOk(err)
    t.ok(res)
    t.deepEquals(res.name, placeName1)
    t.deepEquals(res.description, placeDesc1)
  }
  sp.describe(placeName1, placeDesc1, (err1, recordedVal) => {
    tryCb(err1, recordedVal)
    sp.find(placeName1, (err2, retreivedVal) => {
      tryCb(err2, retreivedVal)
      t.end()
    })
  })
})

test('can link one location to another; link() calls back on the space that was linked FROM', t => {
  let sp = spatial(makeHyperkv())
  sp.describe(placeName1, placeDesc1, (err, res) => {
    sp.describe(placeName2, placeDesc2, (err, res) => {
      sp.link(placeName1, placeName2, command, (err, res) => {
        t.notOk(err)
        t.ok(res)
        t.deepEquals(res.name, placeName1)
        t.deepEquals(res.description, placeDesc1)
        t.deepEquals(res.edges[0].goesTo, placeName2)
        t.deepEquals(res.edges[0].command, command)
        t.end()
      })
    })
  })
})

test('fine to link to a place that doesn\'t exist yet', t => {
  let sp = spatial(makeHyperkv())
  sp.describe(placeName1, placeDesc1, (err, res) => {
    sp.link(placeName1, placeName2, command, (err, res) => {
      t.notOk(err)
      t.ok(res)
      t.deepEquals(res.name, placeName1)
      t.deepEquals(res.description, placeDesc1)
      t.deepEquals(res.edges[0].goesTo, placeName2)
      t.deepEquals(res.edges[0].command, command)
      t.end()
    })
  })
})

test('can unlink one location from another via its command', t => {
  let sp = spatial(makeHyperkv())
  sp.describe(placeName1, placeDesc1, (err, res) => {
    sp.link(placeName1, placeName2, command, (err, res) => {
//console.log(res)
      sp.unlink(placeName1, command, (e, r) => {
//console.log(r)
        t.notOk(e)
        t.ok(r)
        t.deepEquals(r.edges, [])
        t.end()
      })
    })
  })
})


// TODO below
// 
// // that it fails as it should -----------------------------------------------------
// test('describe() calls back error if we mess up types or something', t => {
//   t.end()
// })
//
//test('get() calls back error if we try to get a place that doesnt exist', t => {
//  t.end()
//})
//
// test('get() calls back error if we get something with a bad schema from the hyperkv', t => {
//   t.end()
// })
// 
// test('link() calls back error if we try to link FROM a place that doesnt exist', t => {t.end()
// })
// 
// test('unlink() calls back error if we try to unlink FROM a place that doesnt exist', t => {t.end()
//                                                                                       })
// 
// test('link() calls back error if we try to link to something that isnt sanitary (e.g. a place with script tags, with a command that has script tags)', t => {
//   t.end()
// })
// 
// test('unlink() calls back error if we unlink a command that doesnt exist in a place', t => {
//   t.end()
// })

// test('createReadStream will feed only verified new nodes - will ignore funny nodes', t => {
//   t.end()
// })
