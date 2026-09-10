#![cfg(unix)]

use agent_sandboxd::protocol::CommandRequest;
use agent_sandboxd::supervise;
use std::time::{Duration, Instant};

fn shell(script: &str, max_output_bytes: u64, timeout_ms: u64) -> CommandRequest {
    CommandRequest {
        args: vec!["-c".into(), script.into()],
        command: "/bin/sh".into(),
        cwd: String::new(),
        max_output_bytes,
        timeout_ms,
    }
}

#[test]
fn captures_both_streams_with_independent_bounds() {
    let output =
        supervise(&shell("printf abcdef; printf 123456 >&2", 4, 1_000)).expect("command succeeds");

    assert_eq!(output.exit_code, Some(0));
    assert_eq!(output.stdout, "abcd");
    assert_eq!(output.stderr, "1234");
    assert!(output.stdout_truncated);
    assert!(output.stderr_truncated);
    assert!(!output.timed_out);
}

#[test]
fn reports_nonzero_exit_codes() {
    let output = supervise(&shell("exit 7", 64, 1_000)).expect("command completes");

    assert_eq!(output.exit_code, Some(7));
    assert!(!output.timed_out);
}

#[test]
fn deadline_kills_the_process_group_and_closes_its_pipes() {
    let started = Instant::now();
    let output = supervise(&shell("sleep 5", 64, 25)).expect("timeout is handled");

    assert!(output.timed_out);
    assert_eq!(output.exit_code, None);
    assert!(started.elapsed() < Duration::from_secs(1));
}
