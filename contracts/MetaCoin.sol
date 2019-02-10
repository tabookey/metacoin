pragma solidity ^0.4.24;

import "./ConvertLib.sol";
import "tabookey-gasless/contracts/RelayRecipient.sol";


// This is just a simple example of a coin-like contract.
// It is not standards compatible and cannot be expected to talk to other
// coin/token contracts. If you want to create a standards-compliant
// token, see: https://github.com/ConsenSys/Tokens. Cheers!

contract MetaCoin is RelayRecipient {
	mapping (address => uint) balances;

	event Transfer(address indexed _from, address indexed _to, uint256 _value);

	constructor() public {
		balances[tx.origin] = 10000;
	}

	function sendCoin(address receiver, uint amount) public returns(bool sufficient) {
		if (balances[get_sender()] < amount) return false;
		balances[get_sender()] -= amount;
		balances[receiver] += amount;
		emit Transfer(get_sender(), receiver, amount);
		return true;
	}

	function getBalanceInEth(address addr) public view returns(uint){
		return ConvertLib.convert(getBalance(addr),2);
	}

	function getBalance(address addr) public view returns(uint) {
		return balances[addr];
	}


	mapping (address=>bool) minted;

    /**
     * mint some coins for this caller.
     * (in a real-life application, minting is protected for admin, or by other mechanism.
     * but for our sample, any user can mint some coins - but just once..
     */
    function mint() public {
        require(!minted[get_sender()]);
        minted[get_sender()] = true;
        balances[get_sender()] += 10000;
    }

    /**
     * initialize RelayHub for our contract.
     * This call is required so the contract will recognize relayed calls from direct calls.
     * Without knowing the relay, get_sender() cannot return the address of the real sender.
     * In production contracts, this call is done from the constructor, or restricted to ownerOnly.
     */
    function init_hub(RelayHub hub_addr) public {
        init_relay_hub(hub_addr);
    }

    function accept_relayed_call(address /*relay*/, address /*from*/,
        bytes /*encoded_function*/, uint /*gas_price*/, uint /*transaction_fee*/ ) public view returns(uint32) {
        return 0; //accept everything.
    }

    //nothing to be done post-call. still, we must implement this method.
    function post_relayed_call(address /*relay*/ , address /*from*/,
        bytes /*encoded_function*/, bool /*success*/, uint /*used_gas*/, uint /*transaction_fee*/ ) public {
    }

}
