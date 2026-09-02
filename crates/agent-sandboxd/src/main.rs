use agent_sandboxd::protocol::{ClientMessage, SupervisorResponse};
use agent_sandboxd::supervise;
use serde_json::Value;
use std::io::{self, BufRead, BufWriter, Write};

const INVALID_REQUEST_ID: &str = "invalid-request";

fn main() {
    if let Err(error) = run() {
        eprintln!("agent-sandboxd: {error}");
        std::process::exit(1);
    }
}

fn run() -> io::Result<()> {
    let stdin = io::stdin();
    let mut stdout = BufWriter::new(io::stdout().lock());

    for line in stdin.lock().lines() {
        let line = line?;
        if line.trim().is_empty() {
            continue;
        }
        let response = handle_line(&line);
        serde_json::to_writer(&mut stdout, &response)?;
        stdout.write_all(b"\n")?;
        stdout.flush()?;
    }

    Ok(())
}

fn handle_line(line: &str) -> SupervisorResponse {
    match serde_json::from_str::<ClientMessage>(line) {
        Ok(ClientMessage::ExecuteCommand { id, request: _ }) if id.is_empty() => {
            SupervisorResponse::CommandRejected {
                id: INVALID_REQUEST_ID.into(),
                reason: "id must not be empty".into(),
            }
        }
        Ok(ClientMessage::ExecuteCommand { id, request }) => match supervise(&request) {
            Ok(output) => SupervisorResponse::CommandSucceeded { id, output },
            Err(error) => SupervisorResponse::CommandRejected {
                id,
                reason: error.to_string(),
            },
        },
        Err(error) => SupervisorResponse::CommandRejected {
            id: recover_id(line),
            reason: format!("invalid request: {error}"),
        },
    }
}

fn recover_id(line: &str) -> String {
    serde_json::from_str::<Value>(line)
        .ok()
        .and_then(|value| value.get("id")?.as_str().map(str::to_owned))
        .filter(|id| !id.is_empty())
        .unwrap_or_else(|| INVALID_REQUEST_ID.into())
}
