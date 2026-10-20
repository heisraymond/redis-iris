"""RedisJSON commands that do not rely on redis-py's shared JSON.GET response callback.

Each ``client.json()`` call registers a new decoder on the client's shared callback table
before that decoder is ready. A pipeline finishing on another thread in that window gets
the reply back undecoded, so concurrent requests occasionally saw a JSON string instead
of a document. These helpers send the commands directly and decode any reply shape.
"""

import json
from typing import Any

from redis import Redis
from redis.client import Pipeline


def decode_json(raw: Any) -> Any:
    """Return a decoded document whether or not a JSON.GET callback already decoded it."""
    return json.loads(raw) if isinstance(raw, str | bytes) else raw


def json_get(client: Redis | Pipeline, key: str) -> Any:
    """Read a whole document. On a pipeline, decode the queued result after execute()."""
    reply = client.execute_command("JSON.GET", key)  # type: ignore[no-untyped-call]
    return reply if isinstance(client, Pipeline) else decode_json(reply)


def json_set(client: Redis | Pipeline, key: str, value: Any) -> Any:
    return client.execute_command("JSON.SET", key, "$", json.dumps(value))  # type: ignore[no-untyped-call]
