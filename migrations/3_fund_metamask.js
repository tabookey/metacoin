/* global web3 */
// put your metamask address here, so it will always have some ether on local network...
let myMetamaskAddr = '0x9672F1944590F33425d806E6C0dd0Bc1C07EC47F'

module.exports = function (deployer, network) {
  if (network === 'development') {
    web3.eth.sendTransaction({ from:web3.eth.accounts[0], to: myMetamaskAddr, value: 2e18 }, (e, r) => {
      if (e) {
        console.log('Failed to fund metamask', e)
      } else {
        console.log('Funded metamask @', myMetamaskAddr)
      }
    })
  }
}
