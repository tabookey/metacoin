// Import the page's CSS. Webpack will know what to do with it.
import '../styles/app.css'

// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import metaCoinArtifact from '../../build/contracts/MetaCoin.json'

const tabookey = require('tabookey-gasless')
const cookies = require('browser-cookies')

const RelayProvider = tabookey.RelayProvider

// MetaCoin is our usable abstraction, which we'll use through the code below.
const MetaCoin = contract(metaCoinArtifact)

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
let accounts
let account

const networks = {
  ropsten: {
    name:'Ropsten',
    baseurl:'https://ropsten.etherscan.io/',
    nodeurl:'https://ropsten.infura.io/v3/c3422181d0594697a38defe7706a1e5b',
    id:3

  },
  xdai: {
    name:'xDai',
    baseurl:'https://blockscout.com/poa/dai/',
    nodeurl:'https://dai.poa.network',
    id:100
  },
  local: {
    name:'Local Ganache',
    // no urls for dev... just for test
    baseurl:'https://ropsten.etherscan.io/',
    nodeurl:'http://127.0.0.1:8545',
    id:-1 // no specific id
  }
}

let network
let keysource

const App = {
  start: function () {
    const self = this

    var provider = new RelayProvider(web3.currentProvider, {
      txfee: 12,
      verbose: location.href.indexOf('debug') > 0,
      force_gasLimit: 5000000
    })
    web3.setProvider(provider)

    // Bootstrap the MetaCoin abstraction for Use.
    MetaCoin.setProvider(web3.currentProvider)

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function (err, accs) {
      if (err != null) {
        // alert('There was an error fetching your accounts.')
        self.setStatus('ERROR: Unable to fetch account')
        return
      }

      let relayclient = provider.relayClient
      if (cookies.get('keysource') !== 'metamask') {
        let keycookie = cookies.get('keypair')
        let ephemeralKeypair
        if (keycookie) {
          ephemeralKeypair = JSON.parse(keycookie)
        } else {
          ephemeralKeypair = relayclient.newEphemeralKeypair()
          cookies.set('keypair', JSON.stringify({
            address: ephemeralKeypair.address,
            privateKey: ephemeralKeypair.privateKey
          }))
        }

        relayclient.useKeypairForSigning(ephemeralKeypair)

        account = ephemeralKeypair.address
        accounts = [account]
      } else {
        relayclient.useKeypairForSigning(null)

        accounts = accs
        account = accounts[0]
      }

      self.refreshBalance()
    })
  },

  changeKeySource : function (keysource) {
    console.log('keysource=', keysource)
    if (cookies.get('keysource') !== keysource) {
      cookies.set('keysource', keysource)
      location.reload()
    }
  },

  setStatus: function (message) {
    const status = document.getElementById('status')
    status.innerHTML = message
  },

  link: function (path, text) {
    return '<a href="' + network.baseurl + path + '">' + text + '</a>'
  },

  refreshBalance: function () {
    const self = this

    let meta
    MetaCoin.deployed().then(function (instance) {
      meta = instance
      const address = document.getElementById('address')
      address.innerHTML = self.link('address/' + account, account)

      return meta.getBalance.call(account, { from: account })
    }).then(function (value) {
      const balanceElement = document.getElementById('balance')
      balanceElement.innerHTML = value.valueOf()

      return meta.get_hub_addr.call({ from: account })
    }).then(function (hubaddr) {
      const hubaddrElement = document.getElementById('hubaddr')
      hubaddrElement.innerHTML = self.link('address/' + hubaddr, hubaddr)
    }).catch(function (e) {
      console.log(e)
      self.setStatus('Error getting balance; see log.')
    })
  },

  mint : function () {
    const self = this

    MetaCoin.deployed().then(function (instance) {
      self.setStatus('Mint: Initiating transaction... (please wait)')
      return instance.mint({ from:account })
    }).then(function (res) {
      self.refreshBalance()
      self.setStatus('Mint transaction complete!<br>\n' + self.link('tx/' + res.tx, res.tx))
    }).catch(function (err) {
      console.log('mint error: ', err)
      self.setStatus('Error getting balance; see log.')
    })
  },

  sendCoin: function () {
    const self = this

    const amount = parseInt(document.getElementById('amount').value)
    const receiver = document.getElementById('receiver').value

    this.setStatus('Initiating transaction... (please wait)')

    let meta
    MetaCoin.deployed().then(function (instance) {
      meta = instance
      return meta.sendCoin(receiver, amount, { from: account })
    }).then(function (res) {
      self.setStatus('Transaction complete!<br>\n' + self.link('tx/' + res.tx, res.tx))
      self.refreshBalance()
    }).catch(function (e) {
      console.log(e)
      self.setStatus('Error sending coin; see log.')
    })
  }
}

window.App = App

window.addEventListener('load', function () {
  let keysourceForm = document.getElementById('keysource')
  keysource = cookies.get('keysource') || 'local'

  keysourceForm.elements[keysource].checked = true
  if (typeof web3 === 'undefined') {
    let hideMetamask = document.getElementById('hide_metamask')
    hideMetamask.hidden = true
  }
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined' && keysource === 'metamask') {
    web3.version.getNetwork((e, netver) => {
      console.log('ganache netver=' + netver)
      if (netver > 1000000) {
        netver = -1
      }
      for (let net in networks) {
        // eslint-disable-next-line
        if (networks[net].id == netver) {
          network = networks[net]
          break
        }
      }
      if (!network) {
        alert("Sample doesn't support network: " + netver)
      } else {
        const netmaskNet = document.getElementById('metamask_net')
        netmaskNet.innerHTML = '(' + network.name + ')'

        console.log('using Ganache with network: ' + network.nodeurl)
      }
    })

    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider)
  } else {
    network = networks[keysource] || networks['local']

    let host = location.href.match(/:\/\/([^:/]+)/)
    let nodeurl = network.nodeurl
    if (host) {
      nodeurl = nodeurl.replace(/localhost|127.0.0.1/, host[1])
    }

    console.log('Create Web3 with network: ' + nodeurl)

    window.web3 = new Web3(new Web3.providers.HttpProvider(nodeurl))
  }

  App.start()
})
