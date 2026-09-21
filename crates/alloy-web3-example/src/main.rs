use alloy_web3_example::{
    counter_address_from_env, fetch_snapshot, rpc_url_from_env, summarize_snapshot,
};
use eyre::Result;

#[tokio::main]
async fn main() -> Result<()> {
    let rpc_url = rpc_url_from_env();
    let counter_address = counter_address_from_env()?;
    let snapshot = fetch_snapshot(&rpc_url, counter_address).await?;

    println!("{}", summarize_snapshot(&snapshot));

    Ok(())
}
