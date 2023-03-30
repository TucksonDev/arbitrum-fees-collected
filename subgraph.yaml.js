const fs = require("fs");

// Starting blocks (217538, 70483310)
// Testing blocks => SafeFeesReceiver (62459826) -- RewardDistribution (72194732)
const balanceCheckerStartBlock = 217538;
const safeFeesReceiverStartBlock = 217538;
const rewardDistributorsStartBlock = 70483310;
const graftLastBlock = 72190000;

// Contracts
const balanceCheckerContract = "0x0000000000000000000000000000000000000001";
const safeFeesReceiverContract = "0x98e4db7e07e584f89a2f6043e7b7c89dc27769ed";

// All these generate the same API, we will only use the first one
// but we don't want graph to complain about the names of the dataSources
const rewardDistributorContracts = {
  RewardDistributor: "0xE6ec2174539a849f9f3ec973C66b333eD08C0c18",
  RewardDistributorL1Surplus: "0x2E041280627800801E90E9Ac83532fadb6cAd99A",
  RewardDistributorL2Base: "0xbF5041Fc07E1c866D15c749156657B8eEd0fb649",
  RewardDistributorL2Surplus: "0x32e7AF5A8151934F3787d0cD59EB6EDd0a736b1d",
};

console.log(`Preparing subgraph manifest...`);

const yaml = (strings, ...keys) =>
  strings
    .flatMap((string, i) => [
      string,
      Array.isArray(keys[i]) ? keys[i].join("") : keys[i],
    ])
    .join("")
    .substring(1); // Skip initial newline

const manifest = yaml`
specVersion: 0.0.5
schema:
  file: ./schema.graphql
features:
  - grafting
dataSources:
  - kind: ethereum/contract
    name: Fees
    network: arbitrum-one
    source:
      address: "${balanceCheckerContract}"
      abi: BalanceChecker
      startBlock: ${balanceCheckerStartBlock}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Fees
      abis:
        - name: BalanceChecker
          file: ./abis/BalanceChecker.json
      blockHandlers:
        - handler: handleBlock
      file: ./src/balance-checker.ts
  - kind: ethereum/contract
    name: SafeFeesReceiver
    network: arbitrum-one
    source:
      address: "${safeFeesReceiverContract}"
      abi: SafeFeesReceiver
      startBlock: ${safeFeesReceiverStartBlock}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Fees
      abis:
        - name: SafeFeesReceiver
          file: ./abis/SafeFeesReceiver.json
      eventHandlers:
        - event: SafeReceived(indexed address,uint256)
          handler: handleSafeReceived
      file: ./src/safe-fees-receiver.ts
${Object.entries(rewardDistributorContracts).map(
  ([name, address]) => yaml`
  - kind: ethereum/contract
    name: ${name}
    network: arbitrum-one
    source:
      address: "${address}"
      abi: RewardDistributor
      startBlock: ${rewardDistributorsStartBlock}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Fees
      abis:
        - name: RewardDistributor
          file: ./abis/RewardDistributor.json
      eventHandlers:
        - event: OwnerRecieved(indexed address,indexed address,uint256)
          handler: handleOwnerRecieved
        - event: RecipientRecieved(indexed address,uint256)
          handler: handleRecipientRecieved
      file: ./src/reward-distributor.ts
`
)}graft:
  base: QmRjWQu6dFX5xN5Z159aNdqUt25D3cooAoNTpJs8gbFy6R
  block: ${graftLastBlock}
`;

fs.writeFileSync("subgraph.yaml", manifest);
