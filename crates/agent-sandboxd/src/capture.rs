use std::io::{self, Read};

pub(crate) struct Capture {
    pub(crate) bytes: Vec<u8>,
    pub(crate) truncated: bool,
}

pub(crate) fn read_bounded(mut reader: impl Read, limit: usize) -> io::Result<Capture> {
    let mut bytes = Vec::with_capacity(limit.min(8 * 1024));
    let mut buffer = [0_u8; 8 * 1024];
    let mut truncated = false;

    loop {
        let read = reader.read(&mut buffer)?;
        if read == 0 {
            break;
        }

        let retained = read.min(limit.saturating_sub(bytes.len()));
        bytes.extend_from_slice(&buffer[..retained]);
        truncated |= retained < read;
    }

    Ok(Capture { bytes, truncated })
}

#[cfg(test)]
mod tests {
    use super::read_bounded;

    #[test]
    fn drains_input_but_retains_only_the_limit() {
        let capture = read_bounded(&b"abcdefgh"[..], 3).expect("capture succeeds");

        assert_eq!(capture.bytes, b"abc");
        assert!(capture.truncated);
    }

    #[test]
    fn zero_is_a_valid_capture_limit() {
        let capture = read_bounded(&b"x"[..], 0).expect("capture succeeds");

        assert!(capture.bytes.is_empty());
        assert!(capture.truncated);
    }
}
