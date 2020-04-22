var ConvertLib = artifacts.require('./ConvertLib.sol')
var MetaCoin = artifacts.require('./MetaCoin.sol')

module.exports = async function (deployer, network) {
  await deployer.deploy(ConvertLib)
  await deployer.link(ConvertLib, MetaCoin)
  await deployer.deploy(MetaCoin)
  console.log('Finished 2/3 migrations files')
}
