#![cfg(unix)]

use serde_json::{json, Value};
use std::io::Write;
use std::process::{Command, Stdio};

#[test]
fn serves_one_ndjson_response_per_request() {
    let mut daemon = Command::new(env!("CARGO_BIN_EXE_agent-sandboxd"))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("daemon starts");
    let request = json!({
        "_tag": "ExecuteCommand",
        "id": "integration-1",
        "request": {
            "args": ["-c", "printf hello"],
            "command": "/bin/sh",
            "cwd": "",
            "maxOutputBytes": 1024,
            "timeoutMs": 1000
        }
    });
    let mut stdin = daemon.stdin.take().expect("piped stdin");
    writeln!(stdin, "{request}").expect("request is written");
    drop(stdin);

    let output = daemon.wait_with_output().expect("daemon exits");
    let response: Value = serde_json::from_slice(&output.stdout).expect("NDJSON response");

    assert!(output.status.success());
    assert_eq!(response["_tag"], "CommandSucceeded");
    assert_eq!(response["id"], "integration-1");
    assert_eq!(response["output"]["stdout"], "hello");
    assert_eq!(response["output"]["timedOut"], false);
}
