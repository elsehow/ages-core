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


// edge & error cases ------------------------------------------------------------------------

test('describe() calls back error if we mess up types or something', t => {
  let sp = spatial(makeHyperkv())
  sp.describe(placeName1, 52, (err, res) => {
    t.ok(err)
    sp.describe(51, placeName1, (err, res) => {
      t.ok(err)
      sp.describe(placeName1, {wow: 'nice'}, (err, res) => {
        t.ok(err)
        t.end()
      })
    })
  })
})

test('find() will sanitize a place with script tags', t => {
  let hkv = makeHyperkv()
  let sp = spatial(hkv)
  hkv.put(placeName1, {
    name: placeName1,
    description: placeDesc1 + '<script>alert("hacked")</script',
  }, (err, res) => {
    t.ok(res)
    sp.find(placeName1, (e, p) => {
      t.notOk(e)
      t.ok(p)
      t.deepEquals(p.description, placeDesc1)
      t.end()
    })
  })
})

test('find() calls back null, undefined on err, place, respectively, if we try to get a place that doesnt exist', t => {
  let sp = spatial(makeHyperkv())
  sp.find('gobbldigook', (err, res) => {
    t.deepEqual(err, null)
    t.deepEqual(res, undefined)
    t.end()
  })
})

test('find() calls back null, undefined on err, place, respectively, if we get something with a bad schema from the hyperkv', t => {
  let hkv = makeHyperkv()
  let sp = spatial(hkv)
  hkv.put('a quiet library', { bad: 'thing'}, (err, res) => {
    t.ok(res)
    sp.find('a quiet library', (err, res) => {
      t.deepEqual(err, null)
      t.deepEqual(res, undefined)
      t.end()
    })
  })
})

test('link() calls back error if we try to link FROM a place that doesnt exist', t => {
  let sp = spatial(makeHyperkv())
  sp.link(placeName1, placeName2, command, (err, res) => {
    t.ok(err)
    t.notOk(res)
    t.end()
  })
})

test('unlink() calls back error if we try to unlink FROM a place that doesnt exist', t => {
  let sp = spatial(makeHyperkv())
  sp.unlink(placeName1, command, (err, res) => {
    t.ok(err)
    t.notOk(res)
    t.end()
  })
})

test('unlink() calls back error, and unmodified place, if we unlink a command that doesnt exist in a place', t => {
  let sp = spatial(makeHyperkv())
  sp.describe(placeName1, placeDesc1, (err1, res1) => {
    sp.link(placeName1, placeName2, command, (err2, res2) => {
      sp.unlink(placeName1, 'some random command', (err3, res3) => {
        t.ok(err3)
        t.deepEquals(res3, res2)
        t.end()
      })
    })
  })
})

test('createReadStream will feed only verified new nodes - will ignore funny nodes', t => {
  let hkv = makeHyperkv()
  let sp = spatial(hkv)
  // descriptions we expect to see
  let i = 0
  let expectedDescs = [
    placeDesc1,
    placeDesc2,
  ]
  // make a read stream
  sp.createReadStream({live: true}).on('data', space => {
    t.deepEqual(space.description, expectedDescs[i])
    i+=1
    if (i == expectedDescs.length)
      t.end()
  })
  // put good thing on the log
  sp.describe(placeName1, placeDesc1, (e1, r1) => {
    // put bad thing on the log
    hkv.put('bad thing', {bad: 'thing'}, (e2, r2) => {
      // put a good thing on the log
      sp.describe(placeName2, placeDesc2, (e3, r3) => {
      })
    })
  })
})
