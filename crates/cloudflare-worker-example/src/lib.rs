use worker::*;

/// Lists at most this many artifact keys so one request stays cheap.
const ARTIFACT_LIST_LIMIT: u32 = 10;

#[event(fetch)]
async fn fetch(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    match req.path().as_str() {
        "/" => Response::ok(env.var("GREETING")?.to_string()),
        "/artifacts" => {
            let listing = env
                .bucket("ARTIFACTS")?
                .list()
                .limit(ARTIFACT_LIST_LIMIT)
                .execute()
                .await?;
            let keys: Vec<String> = listing
                .objects()
                .iter()
                .map(|object| object.key())
                .collect();
            Response::from_json(&keys)
        }
        _ => Response::error("Not Found", 404),
    }
}
