/**
 * MsgBlock
 * ========
 *
 * Sends one block.
 */
'use strict'
let dependencies = {
  Block: require('./block'),
  Msg: require('./msg'),
  asink: require('asink')
}

let inject = function (deps) {
  let Block = deps.Block
  let Msg = deps.Msg
  let asink = deps.asink

  function MsgBlock (magicnum, cmdbuf, datasize, checksumbuf, databuf) {
    if (!(this instanceof MsgBlock)) {
      return new MsgBlock(magicnum, cmdbuf, datasize, checksumbuf, databuf)
    }
    this.initialize()
    this.fromObject({magicnum, cmdbuf, datasize, checksumbuf, databuf})
  }

  MsgBlock.prototype = Object.create(Msg.prototype)
  MsgBlock.prototype.constructor = MsgBlock

  MsgBlock.prototype.fromBlock = function (block) {
    this.setData(block.toBuffer())
    this.setCmd('block')
    return this
  }

  MsgBlock.prototype.asyncFromBlock = function (block) {
    return asink(function *() {
      yield this.asyncSetData(block.toBuffer())
      this.setCmd('block')
      return this
    }, this)
  }

  MsgBlock.prototype.toBlock = function () {
    return Block().fromBuffer(this.databuf)
  }

  MsgBlock.prototype.isValid = function () {
    return this.getCmd() === 'block'
  }

  return MsgBlock
}

inject = require('injecter')(inject, dependencies)
let MsgBlock = inject()
MsgBlock.Mainnet = inject({
  Block: require('./block').Mainnet,
  Msg: require('./msg').Mainnet
})
MsgBlock.Testnet = inject({
  Block: require('./block').Testnet,
  Msg: require('./msg').Testnet
})
module.exports = MsgBlock