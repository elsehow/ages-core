'use strict'
const test = require('tape')
const mod = require('..')
const Kefir = require('kefir')
const EventEmitter = require('events').EventEmitter

const streamAndEmitter = (em, ev) => {
  return [
    (x) => em.emit(ev, x),
    Kefir.fromEvents(em, ev)
  ]
}

const coreCommands = (outF) => {
  return [
    {"say {something}": ({something}) => {
      outF(`Elsehow says \"${something}.\"`)
    }},
    {"look": () => {
      outF(`Description of the room...`)
    }},
    {":{does}": ({does}) => {
      outF(`Elsehow ${does}`)
    }},
  ]
}

// TODO in the future, will take /at least/ a hyperkv-like object, and a starting location
// TODO in the further future, probably an identity and a relay server, as well
function ages () {

  let emitter = new EventEmitter()
  let [inputF, inputS] = streamAndEmitter(emitter, 'input')
  let [outputF, outputS] = streamAndEmitter(emitter, 'output')
  let cmdr = require('text-commander')(coreCommands(outputF))

  let em2 = new EventEmitter()
  inputS
    .map(cmdr) // warning - side-effecty
    .filter(x => x==false)
    .onValue(() => {
      outputF("I didn't understand that, sorry.")
    })

  return {
    inputF: inputF,
    outputS: outputS,
  }
}

const a = ages()
//process.stdin.on('data', a.inputF)

//a.outputS.log('output')

var checkOutput = () => {}
function setToExpect (out, cb) {
  checkOutput = (x) => {
    console.log(x === out, x, out)
    a.outputS.offValue(checkOutput)
    if (cb) cb()
  }
  a.outputS.onValue(checkOutput)
}

function send (cmd, expected, cb) {
  setToExpect(expected, cb)
  a.inputF(cmd)
}

//setToExpect('Elsehow says "hello."')
//a.inputF('say hello')
//setToExpect('Description of the room...')
//a.inputF('look')

send('say hello', 'Elsehow says "hello.",', () => {
  send('look', 'Description of the room...', () => {
    send('look at door', 'Description of the room...')
  })
})

a.inputF('look at door')
a.inputF(':shakes his head. "It\'s majestic," he says.')
a.inputF('fall through the book')


