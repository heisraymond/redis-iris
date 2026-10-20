"""JSON reads must not depend on redis-py's shared, re-registered JSON.GET callback."""

import os
import threading
from uuid import uuid4

import pytest
from redis import Redis

from app.catalog.store import ProductStore
from app.redis_json import decode_json
from app.settings import Settings
from tests.test_sync import product


@pytest.mark.parametrize(
    "raw",
    [{"a": [1, "b"]}, '{"a": [1, "b"]}', b'{"a": [1, "b"]}'],
    ids=["decoded", "undecoded-str", "undecoded-bytes"],
)
def test_decode_json_accepts_every_reply_shape(raw) -> None:
    assert decode_json(raw) == {"a": [1, "b"]}


def test_decode_json_keeps_missing_keys_missing() -> None:
    assert decode_json(None) is None


@pytest.mark.skipif(not os.getenv("TEST_REDIS_URL"), reason="Set TEST_REDIS_URL")
def test_concurrent_reads_survive_json_callback_registration() -> None:
    """Each client.json() call re-registers JSON.GET before its decoder is ready."""
    settings = Settings(
        _env_file=None,
        redis_url=os.environ["TEST_REDIS_URL"],
        namespace="test_json_" + uuid4().hex,
    )
    client = Redis.from_url(settings.redis_url)
    store = ProductStore(client, settings)
    store.save(product())
    stop = threading.Event()
    errors: list[BaseException] = []

    def register() -> None:
        while not stop.is_set():
            client.json()

    def read() -> None:
        try:
            for _ in range(1500):
                assert store.get("demo-camera") == product()
        except BaseException as exc:  # noqa: BLE001 - surface any thread failure
            errors.append(exc)

    threads = [threading.Thread(target=register)] + [
        threading.Thread(target=read) for _ in range(4)
    ]
    try:
        for thread in threads:
            thread.start()
        for thread in threads[1:]:
            thread.join()
    finally:
        stop.set()
        threads[0].join()
        keys = list(client.scan_iter(match=settings.namespace + ":*"))
        if keys:
            client.delete(*keys)
        client.close()
    assert not errors, errors[0]
