var ConvertLib = artifacts.require('./ConvertLib.sol')
var MetaCoin = artifacts.require('./MetaCoin.sol')

let networks = {
  'ropsten': {
    relayHubAddr: '0x1349584869A1C7b8dc8AE0e93D8c15F5BB3B4B87'
  },
  'development': {
    relayHubAddr: '0x9C57C0F1965D225951FE1B2618C92Eefd687654F'
  }
}

var RelayHub = artifacts.require('./RelayHub.sol')

module.exports = async function (deployer, network) {
  await deployer.deploy(ConvertLib)
  await deployer.link(ConvertLib, MetaCoin)
  let hubAddr = networks[network].relayHubAddr

  await deployer.deploy(MetaCoin)
  console.log('hub=', hubAddr)
  let hub = await RelayHub.at(hubAddr)
  await hub.depositFor(MetaCoin.address, { value:1e17 })
  console.log("== Initializing Metacoin's Hub")
  let metacoin = await MetaCoin.at(MetaCoin.address)
  await metacoin.init_hub(hubAddr)
  console.log("Finished 2/3 migrations files")
  }
