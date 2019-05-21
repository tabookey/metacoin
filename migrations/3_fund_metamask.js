/* global web3 */
// put your metamask address here, so it will always have some ether on local network...
let myMetamaskAddr = '0x72c413575D8e2223757068B687c906cc46DA0Af0'

module.exports = async function (deployer, network) {
  if (network === 'development') {
    let accounts = await web3.eth.getAccounts() 
//    console.log("accounts =", accounts)
    web3.eth.sendTransaction({ from:accounts[0], to: myMetamaskAddr, value: 2e18 }, (e, r) => {
      if (e) {
        console.log('Failed to fund metamask', e)
      } else {
        console.log('Funded metamask @', myMetamaskAddr)
      }
    })
  }
}
