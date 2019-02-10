var ConvertLib = artifacts.require('./ConvertLib.sol')
var MetaCoin = artifacts.require('./MetaCoin.sol')

let networks = {
  'ropsten': {
    relayHubAddr: '0x1349584869A1C7b8dc8AE0e93D8c15F5BB3B4B87'
  },
  'xdai': {
    relayHubAddr: '0x49a984490a7762B0e5d775f0FfA608899Ebe2ee8'
  },
  'development': {
    relayHubAddr: '0x9C57C0F1965D225951FE1B2618C92Eefd687654F'
  }
}

var RelayHub = artifacts.require('./RelayHub.sol')

module.exports = function (deployer, network) {
  deployer.deploy(ConvertLib)
  deployer.link(ConvertLib, MetaCoin)
  let hubAddr = networks[network].relayHubAddr

  deployer.deploy(MetaCoin).then(() => {
    console.log('hub=', hubAddr)
  }).then(() => {
    let hub = RelayHub.at(hubAddr)
    return hub.depositFor(MetaCoin.address, { value:1e18 })
  }).then(() => {
    console.log("== Initializing Metacoin's Hub")
    return MetaCoin.at(MetaCoin.address).init_hub(hubAddr)
  }).catch(e => {
    console.log('error: ', e)
  })
}
