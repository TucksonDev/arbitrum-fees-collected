import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { Fee } from '../generated/schema'
import { OwnerRecieved, RecipientRecieved } from '../generated/RewardDistributor/FeesReceiver'

let EIGHTEEN_DECIMALS = BigInt.fromI32(10).pow(18).toBigDecimal()
let ZERO = BigInt.fromI32(0).toBigDecimal()

export function handleOwnerRecieved(event: OwnerRecieved): void {
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400 // rounded

  let entity = Fee.load(dayID.toString())
  if (!entity) {
    entity = new Fee(dayID.toString())
    entity.totalFeesETH = ZERO
    entity.totalWithdrawalsETH = ZERO
  }

  entity.totalWithdrawalsETH = entity.totalWithdrawalsETH.plus(event.params.value.divDecimal(EIGHTEEN_DECIMALS))

  entity.save()
}

export function handleRecipientRecieved(event: RecipientRecieved): void {
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400 // rounded

  let entity = Fee.load(dayID.toString())
  if (!entity) {
    entity = new Fee(dayID.toString())
    entity.totalFeesETH = ZERO
    entity.totalWithdrawalsETH = ZERO
  }

  entity.totalWithdrawalsETH = entity.totalWithdrawalsETH.plus(event.params.value.divDecimal(EIGHTEEN_DECIMALS))

  entity.save()
}
