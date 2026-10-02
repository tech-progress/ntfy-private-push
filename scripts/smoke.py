import base64
import json
import os
import urllib.error
import urllib.request
import uuid

base = os.environ.get("NTFY_SMOKE_URL", "http://127.0.0.1:18101")
username = os.environ.get("NTFY_BOOTSTRAP_USER", "publisher")
password = os.environ["NTFY_BOOTSTRAP_PASSWORD"]
prefix = os.environ.get("NTFY_TOPIC_PREFIX", "alerts-")
topic = prefix + "smoke"
basic = "Basic " + base64.b64encode(f"{username}:{password}".encode()).decode()


def request(path, authorization=None, payload=None):
    headers = {"Authorization": authorization} if authorization else {}
    query = urllib.request.Request(base + path, data=payload, headers=headers)
    try:
        with urllib.request.urlopen(query, timeout=10) as response:
            return response.status, response.read().decode()
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode()


assert request("/v1/health")[0] == 200
assert request("/" + topic, payload=b"anonymous")[0] in (401, 403)
assert request("/" + topic + "/json?poll=1")[0] in (401, 403)
assert request("/outside-namespace", basic, b"not allowed")[0] == 403
assert request("/" + topic, "Basic aW52YWxpZDppbnZhbGlk", b"bad password")[0] in (401, 403)
marker = os.environ.get("NTFY_SMOKE_MARKER", "fixture-" + str(uuid.uuid4()))
if os.environ.get("NTFY_SMOKE_REPLAY_ONLY") != "1" and os.environ.get("NTFY_SMOKE_EXPECT_EXPIRED") != "1":
    status, body = request("/" + topic, basic, marker.encode())
    assert status == 200, (status, body)
    assert json.loads(body)["message"] == marker
status, body = request("/" + topic + "/json?poll=1&since=all", basic)
assert status == 200, (status, body)
found = any(json.loads(line).get("message") == marker for line in body.splitlines())
assert found == (os.environ.get("NTFY_SMOKE_EXPECT_EXPIRED") != "1")
token = os.environ.get("NTFY_SMOKE_TOKEN")
if token:
    if os.environ.get("NTFY_SMOKE_REVOKED_TOKEN") == "1":
        assert request("/" + topic + "/json?poll=1", "Bearer " + token)[0] in (401, 403)
    else:
        assert request("/" + topic + "/json?poll=1", "Bearer " + token)[0] == 200
        assert request("/outside-namespace", "Bearer " + token, b"not allowed")[0] == 403
print("Anonymous denial, namespace ACL and authenticated cache replay passed")
