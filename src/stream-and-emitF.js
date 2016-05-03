const Kefir = require('kefir')
const EventEmitter = require('events').EventEmitter

function streamAndEmitF () {
  let emitter = new EventEmitter()
  let emitF = (x) => emitter.emit('e', x)
  let stream = Kefir.fromEvents(emitter, 'e')
  return [stream, emitF]
}
module.exports = streamAndEmitF
