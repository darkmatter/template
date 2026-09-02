use crate::capture::{read_bounded, Capture};
use crate::protocol::{CommandOutput, CommandRequest};
use std::fmt;
use std::io;
use std::process::{Child, Command, ExitStatus, Stdio};
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};

const MAX_CAPTURE_BYTES: u64 = 8 * 1024 * 1024;
const POLL_INTERVAL: Duration = Duration::from_millis(5);

#[derive(Debug)]
pub enum SupervisorError {
    InvalidRequest(&'static str),
    Io(io::Error),
    CapturePanicked,
}

impl fmt::Display for SupervisorError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidRequest(message) => formatter.write_str(message),
            Self::Io(error) => write!(formatter, "process I/O failed: {error}"),
            Self::CapturePanicked => formatter.write_str("output capture thread panicked"),
        }
    }
}

impl std::error::Error for SupervisorError {}

impl From<io::Error> for SupervisorError {
    fn from(error: io::Error) -> Self {
        Self::Io(error)
    }
}

pub fn supervise(request: &CommandRequest) -> Result<CommandOutput, SupervisorError> {
    validate(request)?;
    let limit = request.max_output_bytes as usize;
    let mut command = Command::new(&request.command);
    command
        .args(&request.args)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    if !request.cwd.is_empty() {
        command.current_dir(&request.cwd);
    }
    configure_process(&mut command);

    let started = Instant::now();
    let mut child = command.spawn()?;
    let process_group = child.id();
    let stdout = child.stdout.take().expect("piped stdout");
    let stderr = child.stderr.take().expect("piped stderr");
    let stdout_reader = thread::spawn(move || read_bounded(stdout, limit));
    let stderr_reader = thread::spawn(move || read_bounded(stderr, limit));
    let (status, timed_out) = wait_for_exit(
        &mut child,
        process_group,
        started,
        Duration::from_millis(request.timeout_ms),
    )?;
    terminate_descendants(process_group)?;

    let stdout = join_capture(stdout_reader)?;
    let stderr = join_capture(stderr_reader)?;
    Ok(CommandOutput {
        exit_code: (!timed_out).then(|| status.code()).flatten(),
        stderr: String::from_utf8_lossy(&stderr.bytes).into_owned(),
        stderr_truncated: stderr.truncated,
        stdout: String::from_utf8_lossy(&stdout.bytes).into_owned(),
        stdout_truncated: stdout.truncated,
        timed_out,
    })
}

fn validate(request: &CommandRequest) -> Result<(), SupervisorError> {
    if request.command.is_empty() {
        return Err(SupervisorError::InvalidRequest("command must not be empty"));
    }
    if request.max_output_bytes > MAX_CAPTURE_BYTES {
        return Err(SupervisorError::InvalidRequest(
            "maxOutputBytes exceeds the 8 MiB daemon limit",
        ));
    }
    Ok(())
}

fn wait_for_exit(
    child: &mut Child,
    process_group: u32,
    started: Instant,
    timeout: Duration,
) -> Result<(ExitStatus, bool), SupervisorError> {
    loop {
        if let Some(status) = child.try_wait()? {
            return Ok((status, false));
        }
        if started.elapsed() >= timeout {
            terminate_process(child, process_group)?;
            return Ok((child.wait()?, true));
        }
        thread::sleep(POLL_INTERVAL.min(timeout.saturating_sub(started.elapsed())));
    }
}

fn join_capture(reader: JoinHandle<io::Result<Capture>>) -> Result<Capture, SupervisorError> {
    reader
        .join()
        .map_err(|_| SupervisorError::CapturePanicked)?
        .map_err(SupervisorError::Io)
}

#[cfg(unix)]
fn configure_process(command: &mut Command) {
    use std::os::unix::process::CommandExt;
    command.process_group(0);
}

#[cfg(not(unix))]
fn configure_process(_: &mut Command) {}

#[cfg(unix)]
fn terminate_process(_: &mut Child, process_group: u32) -> io::Result<()> {
    kill_process_group(process_group)
}

#[cfg(not(unix))]
fn terminate_process(child: &mut Child, _: u32) -> io::Result<()> {
    child.kill()
}

#[cfg(unix)]
fn terminate_descendants(process_group: u32) -> io::Result<()> {
    kill_process_group(process_group)
}

#[cfg(not(unix))]
fn terminate_descendants(_: u32) -> io::Result<()> {
    Ok(())
}

#[cfg(unix)]
fn kill_process_group(process_group: u32) -> io::Result<()> {
    let result = unsafe { libc::killpg(process_group as libc::pid_t, libc::SIGKILL) };
    if result == 0 {
        return Ok(());
    }
    let error = io::Error::last_os_error();
    match error.raw_os_error() {
        Some(libc::ESRCH) => Ok(()),
        _ => Err(error),
    }
}
