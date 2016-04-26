'use strict'
const mod = require('..')
const Kefir = require('kefir')
const EventEmitter = require('events').EventEmitter

const coreCommands = (outF) => {
  return [
    {"say {something}": ({something}) => {
      outF(`You say ${something}`)
    }},
    {"look": () => {
      outF(`You look around`)
    }},
    {":{does}": ({does}) => {
      outF(`Elsehow ${does}`)
    }},
  ]
}

function ages () {

  let em = new EventEmitter()
  let inputF = (x) => em.emit('input', x)
  let inputS = Kefir.fromEvents(em, 'input')
  let outputF = (x) => em.emit('output', x)
  let outputS = Kefir.fromEvents(em, 'output')
  let cmdr = require('text-commander')(coreCommands(outputF))

  let em2 = new EventEmitter()
  inputS.onValue(cmdr)
    //.filter(x => x==false)
    //.onValue(() => {
    //  outputF("I didn't understand that, sorry.")
    //})

  return {
    inputF: inputF,
    outputS: outputS,
  }
}

const a = ages()
//process.stdin.on('data', a.inputF)

a.outputS.log('output')

a.inputF('say hello')
a.inputF('look')
a.inputF('look at door')
//a.inputF('fall through the book')
a.inputF(':shakes his head. "It\'s majestic," he says.')


