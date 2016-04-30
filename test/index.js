'use strict'
const test = require('tape')
const Kefir = require('kefir')
// a scrpt for testing
// each element of the array is a list
// of command / expected result
/*
  [
    ['command', 'expected effect'],
    ...
  ]
*/
// TODO should support printing something initially
// TODO should test that some update we didn't make will be pushed to us if relevant
let script = [
  ['say hello', 'Elsehow says "hello."'],
  ['look', 'Description of the room...'],
  ['look at door', 'Description of the room...'],
  [':shakes his head. "It\'s majestic," he says.', 'Elsehow shakes his head. "It\'s majestic," he says.'],
  ['fall through the book', 'I didn\'t understand that, sorry.']
]
// takes a scrpt s (see format below),
function runThrough (scrpt, a, t) {

  let checkOutput = () => {}
  let first = scrpt[0]
  let rest = scrpt.slice(1)

  function setToExpect (t, out, cb) {
    checkOutput = (x) => {
      t.deepEqual(x, out, out)
      a.outputS.offValue(checkOutput)
      if (cb) cb()
    }
    a.outputS.onValue(checkOutput)
  }

  function send (t, cmd, expected, cb) {
    return Kefir.stream(emitter => {
      setToExpect(t, expected, emitter.emit)
      a.inputF(cmd)
    })
  }

  let initialVal = send(t, first[0], first[1])
  return rest.reduce((acc, cur) => {
    return acc.flatMap(() => {
      return send(t, cur[0], cur[1])
    })
  }, initialVal)
}

test('test script', t => {
  const ages = require('..')
  let ag = ages()
  runThrough(script, ag, t).onValue(t.end)
})

