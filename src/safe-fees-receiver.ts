import { BigInt } from '@graphprotocol/graph-ts'
import { Fee } from '../generated/schema'
import { SafeReceived } from '../generated/SafeFeesReceiver/SafeFeesReceiver'

let EIGHTEEN_DECIMALS = BigInt.fromI32(10).pow(18).toBigDecimal()
let ZERO = BigInt.fromI32(0).toBigDecimal()

const feesReceiverEOAs = [
  '0x18A08f3CA72DC4B5928c26648958655690b215ac',
  '0x582A62dB643BCFF3B0Bf1DA45f812e3a354d7518',
  '0xb04D2C62c0Cd8cec5691Cefd2E7CF041EBD26382',
  '0xa4b1E63Cb4901E327597bc35d36FE8a23e4C253f',
  '0xD345e41aE2cb00311956aA7109fC801Ae8c81a52',
  '0xa4B00000000000000000000000000000000000F6',
  '0xC1b634853Cb333D3aD8663715b08f41A3Aec47cc',
]

export function handleSafeReceived(event: SafeReceived): void {
  // Check that this event covers a transfer from any of the fees receiver contracts
  let senderIsFeeReceiver = false
  for (let i = 0; i < feesReceiverEOAs.length; i++) {
    if (feesReceiverEOAs[i].toLowerCase() == event.params.sender.toHexString().toLowerCase()) {
      senderIsFeeReceiver = true
    }
  }
  if (!senderIsFeeReceiver) {
    return
  }

  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400 // rounded

  let entity = Fee.load(dayID.toString())
  if (!entity) {
    entity = new Fee(dayID.toString())
    entity.totalFeesETH = ZERO
    entity.totalWithdrawnETH = ZERO
  }
  // As we are using "grafting", the entity might exist with a null value in totalWithdrawnETH
  if (!entity.totalWithdrawnETH) {
    entity.totalWithdrawnETH = ZERO
  }

  // Do not remove the "!", otherwise TS from thegraph will complain
  entity.totalWithdrawnETH = entity.totalWithdrawnETH!.plus(event.params.value.divDecimal(EIGHTEEN_DECIMALS))

  entity.save()
}
