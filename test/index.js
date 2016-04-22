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
let script = [
  ['say hello', 'Elsehow says "hello."'],
  ['look', 'Description of the room...'],
  ['look at door', 'Description of the room...'],
  [':shakes his head. "It\'s majestic," he says.', 'Elsehow shakes his head. "It\'s majestic," he says.'],
  ['fall through the book', 'I didn\'t understand that, sorry.']
]
// takes a scrpt s (see format below),
function runThrough (scrpt, a, t) {

  var checkOutput = () => {}
  var first = scrpt[0]
  var rest = scrpt.slice(1)
  var initialVal = send(t, first[0], first[1])

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

  return rest.reduce((acc, cur) => {
    return acc.flatMap(() => {
      return send(t, cur[0], cur[1])
    })
  }, initialVal)
}

// tests proper -----------------------------------------------------------/

const ages = require('..')
// smells like recursion
// a reduce, where the accumulator is the send stream,
// to which we can flatmap something and pas it on
// at the last step, we .onValue(t.end)

test('test script', t => {
  let ag = ages()
  runThrough(script, ag, t).onValue(t.end)
})

