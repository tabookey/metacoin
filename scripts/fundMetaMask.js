#!/usr/bin/env node

let Web3 = require( 'web3' )
let web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545' ))

web3.eth.sendTransaction({from:web3.eth.accounts[0], to:'0xd21934eD8eAf27a67f0A70042Af50A1D6d195E81', value:1e19})
