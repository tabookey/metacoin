pragma solidity ^0.5.16;

import "./ConvertLib.sol";
import "opengsn/contracts/BaseRelayRecipient.sol";
import "opengsn/contracts/TrustedForwarder.sol";


// This is just a simple example of a coin-like contract.
// It is not standards compatible and cannot be expected to talk to other
// coin/token contracts. If you want to create a standards-compliant
// token, see: https://github.com/ConsenSys/Tokens. Cheers!

contract MetaCoin is BaseRelayRecipient {
	mapping (address => uint) balances;

	event Transfer(address indexed _from, address indexed _to, uint256 _value);
	event Minted(address to);

	constructor() public {
		balances[tx.origin] = 10000;
		trustedForwarder = address(new TrustedForwarder());
	}

	function sendCoin(address receiver, uint amount) public returns(bool sufficient) {
		if (balances[getSender()] < amount) return false;
		balances[getSender()] -= amount;
		balances[receiver] += amount;
		emit Transfer(getSender(), receiver, amount);
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
        require(!minted[getSender()]);
        minted[getSender()] = true;
        balances[getSender()] += 10000;
				emit Minted(getSender());
    }

}
