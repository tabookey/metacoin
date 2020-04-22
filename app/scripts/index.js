// Import the page's CSS. Webpack will know what to do with it.
import '../styles/app.css'

// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import metaCoinArtifact from '../../build/contracts/MetaCoin.json'
import relayHubArtifact from '../../build/gsn/RelayHub.json'
import stakeManagerArtifact from '../../build/gsn/StakeManager.json'
import paymasterArtifact from '../../build/gsn/Paymaster.json'

const gsn = require('opengsn/dist/src/relayclient/')
const configureGSN = require('opengsn/dist/src/relayclient/GSNConfigurator').configureGSN

const RelayProvider = gsn.default

// MetaCoin is our usable abstraction, which we'll use through the code below.
const MetaCoin = contract(metaCoinArtifact)

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
let accounts
let account
let forwarder

let network = {
  baseurl:'https://ropsten.etherscan.io/'
}

const App = {
  start: function () {
    const self = this
    // This should actually be web3.eth.getChainId but MM compares networkId to chainId apparently
    web3.eth.net.getId(function (err, chainId) {
      if (err) {
        console.log('Error getting chainId', err)
        process.exit(-1)
      }
      const gsnConfig = configureGSN({
        relayHubAddress: relayHubArtifact.address,
        stakeManagerAddress: stakeManagerArtifact.address,
        methodSuffix: '_v4',
        jsonStringifyRequest: true,
        chainId: chainId
      })
      var provider = new RelayProvider(web3.currentProvider, gsnConfig)
      web3.setProvider(provider)

      // Bootstrap the MetaCoin abstraction for Use.
      MetaCoin.setProvider(web3.currentProvider)

      // Get the initial account balance so it can be displayed.
      web3.eth.getAccounts(function (err, accs) {
        if (err != null) {
          alert('There was an error fetching your accounts.')
          return
        }

        if (accs.length === 0) {
          alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.")
          return
        }

        accounts = accs
        account = accounts[0]

        self.refreshBalance()
      })
    })
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

      return meta.getTrustedForwarder.call({ from: account })
    }).then(function (forwarderAddress) {
      forwarder = forwarderAddress
      const hubaddrElement = document.getElementById('hubaddr')
      hubaddrElement.innerHTML = self.link('address/' + relayHubArtifact.address, relayHubArtifact.address)
      const forwarderElement = document.getElementById('forwarderAddress')
      forwarderElement.innerHTML = self.link('address/' + forwarderAddress, forwarderAddress)
    }).catch(function (e) {
      console.log(e)
      self.setStatus('Error getting balance; see log.')
    })
  },

  mint : function () {
    const self = this

    MetaCoin.deployed().then(function (instance) {
      self.setStatus('Mint: Initiating transaction... (please wait)')
      return instance.mint({ from: account, forwarder: forwarder, paymaster: paymasterArtifact.address })
    }).then(function (res) {
      self.refreshBalance()
      self.setStatus('Mint transaction complete!<br>\n' + self.link('tx/' + res.tx, res.tx))
    }).catch(function (err) {
      console.log('mint error:', err)
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
      return meta.sendCoin(receiver, amount,
        { from: account, forwarder: forwarder, paymaster: paymasterArtifact.address })
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
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn(
      'Using web3 detected from external source.' +
      ' If you find that your accounts don\'t appear or you have 0 MetaCoin,' +
      ' ensure you\'ve configured that source properly.' +
      ' If using MetaMask, see the following link.' +
      ' Feel free to delete this warning. :)' +
      ' http://truffleframework.com/tutorials/truffle-and-metamask'
    )
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider)
  } else {
    console.warn(
      'No web3 detected. Falling back to http://127.0.0.1:9545.' +
      ' You should remove this fallback when you deploy live, as it\'s inherently insecure.' +
      ' Consider switching to Metamask for development.' +
      ' More info here: http://truffleframework.com/tutorials/truffle-and-metamask'
    )
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545'))
  }

  App.start()
})
