use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(tag = "_tag")]
pub enum ClientMessage {
    ExecuteCommand { id: String, request: CommandRequest },
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandRequest {
    pub args: Vec<String>,
    pub command: String,
    pub cwd: String,
    pub max_output_bytes: u64,
    pub timeout_ms: u64,
}

#[derive(Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandOutput {
    pub exit_code: Option<i32>,
    pub stderr: String,
    pub stderr_truncated: bool,
    pub stdout: String,
    pub stdout_truncated: bool,
    pub timed_out: bool,
}

#[derive(Debug, Serialize)]
#[serde(tag = "_tag")]
pub enum SupervisorResponse {
    CommandSucceeded { id: String, output: CommandOutput },
    CommandRejected { id: String, reason: String },
}

#[cfg(test)]
mod tests {
    use super::{ClientMessage, SupervisorResponse};

    #[test]
    fn decodes_effect_tagged_request() {
        let json = r#"{
            "_tag":"ExecuteCommand",
            "id":"run-1",
            "request":{
                "args":["hello"],
                "command":"printf",
                "cwd":"/tmp",
                "maxOutputBytes":32,
                "timeoutMs":1000
            }
        }"#;

        let ClientMessage::ExecuteCommand { id, request } =
            serde_json::from_str(json).expect("valid request");

        assert_eq!(id, "run-1");
        assert_eq!(request.command, "printf");
        assert_eq!(request.max_output_bytes, 32);
    }

    #[test]
    fn encodes_effect_tagged_rejection() {
        let response = SupervisorResponse::CommandRejected {
            id: "run-2".into(),
            reason: "nope".into(),
        };

        let json = serde_json::to_value(response).expect("serializable response");

        assert_eq!(json["_tag"], "CommandRejected");
        assert_eq!(json["id"], "run-2");
    }
}
