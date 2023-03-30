const fs = require("fs");

const feesReceiverEOAs = [
  "0x18A08f3CA72DC4B5928c26648958655690b215ac",
  "0x582A62dB643BCFF3B0Bf1DA45f812e3a354d7518",
  "0xb04D2C62c0Cd8cec5691Cefd2E7CF041EBD26382",
  "0xa4b1E63Cb4901E327597bc35d36FE8a23e4C253f",
  "0xD345e41aE2cb00311956aA7109fC801Ae8c81a52",
  "0xa4B00000000000000000000000000000000000F6",
  "0xC1b634853Cb333D3aD8663715b08f41A3Aec47cc",
];

// All these generate the same API, we will only use the first one
// but we don't want graph to complain about the names of the dataSources
const feesReceiverContracts = {
  RewardDistributor: "0xE6ec2174539a849f9f3ec973C66b333eD08C0c18",
  RewardDistributorL1Surplus: "0x2E041280627800801E90E9Ac83532fadb6cAd99A",
  RewardDistributorL2Base: "0xbF5041Fc07E1c866D15c749156657B8eEd0fb649",
  RewardDistributorL2Surplus: "0x32e7AF5A8151934F3787d0cD59EB6EDd0a736b1d",
};

console.log(`Preparing subgraph manifest`);

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
dataSources:
  - kind: ethereum/contract
    name: Fees
    network: arbitrum-one
    source:
      address: "0x0000000000000000000000000000000000000001"
      abi: BalanceChecker
      startBlock: 70483417
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
${Object.entries(feesReceiverContracts).map(
  ([name, address]) => yaml`
  - kind: ethereum/contract
    name: ${name}
    network: arbitrum-one
    source:
      address: "${address}"
      abi: FeesReceiver
      startBlock: 70483417
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Fees
      abis:
        - name: FeesReceiver
          file: ./abis/FeesReceiver.json
      eventHandlers:
        - event: OwnerRecieved(indexed address,indexed address,uint256)
          handler: handleOwnerRecieved
        - event: RecipientRecieved(indexed address,uint256)
          handler: handleRecipientRecieved
      file: ./src/fees-receiver.ts
`
)}`;

fs.writeFileSync("subgraph.yaml", manifest);
