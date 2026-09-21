use alloy::{
    primitives::{Address, U256},
    providers::{Provider, ProviderBuilder},
    sol,
};
use eyre::{Context, Result};

pub const DEFAULT_RPC_URL: &str = "http://127.0.0.1:8545";

sol! {
    #[sol(rpc)]
    interface Counter {
        function number() external view returns (uint256);
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ChainSnapshot {
    pub chain_id: u64,
    pub block_number: u64,
    pub counter: Option<(Address, U256)>,
}

pub fn default_rpc_url() -> &'static str {
    DEFAULT_RPC_URL
}

pub fn rpc_url_from_env() -> String {
    std::env::var("ETH_RPC_URL")
        .ok()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| DEFAULT_RPC_URL.to_owned())
}

pub fn counter_address_from_env() -> Result<Option<Address>> {
    std::env::var("COUNTER_ADDRESS")
        .ok()
        .filter(|value| !value.trim().is_empty())
        .map(|value| parse_counter_address(&value))
        .transpose()
}

pub fn parse_counter_address(value: &str) -> Result<Address> {
    value
        .trim()
        .parse()
        .wrap_err("COUNTER_ADDRESS must be a 20-byte hex address")
}

pub async fn fetch_snapshot(
    rpc_url: &str,
    counter_address: Option<Address>,
) -> Result<ChainSnapshot> {
    // Alloy 0.2 is the newest release compatible with this template's
    // workspace Rust MSRV; its HTTP builder method is `on_http`, while current
    // Alloy docs call the same pattern `connect_http`.
    let provider = ProviderBuilder::new().on_http(rpc_url.parse().wrap_err("invalid ETH_RPC_URL")?);

    let chain_id = provider
        .get_chain_id()
        .await
        .wrap_err("failed to read chain id")?;
    let block_number = provider
        .get_block_number()
        .await
        .wrap_err("failed to read latest block number")?;

    let counter = match counter_address {
        Some(address) => {
            let contract = Counter::new(address, &provider);
            let number = contract
                .number()
                .call()
                .await
                .wrap_err("failed to call Counter.number")?;
            Some((address, number._0))
        }
        None => None,
    };

    Ok(ChainSnapshot {
        chain_id,
        block_number,
        counter,
    })
}

pub fn summarize_snapshot(snapshot: &ChainSnapshot) -> String {
    let base = format!(
        "chain_id={} block_number={}",
        snapshot.chain_id, snapshot.block_number
    );

    match snapshot.counter {
        Some((address, number)) => {
            format!("{base} counter={address} number={number}")
        }
        None => base,
    }
}
