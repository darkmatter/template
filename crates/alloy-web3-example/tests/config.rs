use alloy::primitives::{Address, U256};
use alloy_web3_example::{
    default_rpc_url, parse_counter_address, summarize_snapshot, ChainSnapshot,
};

#[test]
fn default_rpc_url_prefers_local_anvil() {
    assert_eq!(default_rpc_url(), "http://127.0.0.1:8545");
}

#[test]
fn parse_counter_address_trims_and_validates_hex_addresses() {
    let address = parse_counter_address(" 0x0000000000000000000000000000000000000001 ")
        .expect("valid address");

    assert_eq!(
        address,
        Address::from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])
    );
    assert!(parse_counter_address("not-an-address").is_err());
}

#[test]
fn summarize_snapshot_includes_optional_counter_value() {
    let snapshot = ChainSnapshot {
        chain_id: 31_337,
        block_number: 12,
        counter: Some((Address::from([0x42; 20]), U256::from(7))),
    };

    assert_eq!(
        summarize_snapshot(&snapshot),
        "chain_id=31337 block_number=12 counter=0x4242424242424242424242424242424242424242 number=7",
    );
}
