"""Generate the fal asset pack in assets/library/generated from scripts/fal/assets.txt.

Usage: FAL_API_KEY=... python3 scripts/fal/generate.py [--only key1,key2] [--force]
Needs Pillow. Existing files are skipped unless --force.
"""
import argparse, io, json, os, random, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
OUT = os.path.normpath(os.path.join(ROOT, "assets", "library", "generated"))
SPEC = os.path.join(os.path.dirname(__file__), "assets.txt")

SPRITE_MODEL = "openai/gpt-image-2.6/flare/text-to-image"
BG_MODEL = "google/nano-banana-2.1"
SFX_MODEL = "elevenlabs/sound-effects/v3"
MUSIC_MODEL = "elevenlabs/music/v2.5"

SPRITE_STYLE = ("2D mobile game sprite, bold flat cartoon style, clean thick dark outline, soft cel shading, "
                "vibrant saturated colors, single isolated object centered with small margin, fully transparent background, "
                "no text, no ground, no drop shadow. Subject: ")
BG_STYLE = ("Vertical portrait 2D mobile game background, bold flat cartoon style, vibrant colors, soft shading, "
            "no characters, no text, no UI, uncluttered center so game objects stay readable. Scene: ")


def parse_spec():
    items, section = [], None
    for line in open(SPEC):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("["):
            section = line.strip("[]")
            continue
        parts = [p.strip() for p in line.split("|")]
        kind, _, category = section.partition(":")
        item = {"key": parts[0], "description": parts[1], "section": kind, "category": category or kind}
        if kind == "sfx":
            item["duration"] = float(parts[2])
        items.append(item)
    keys = [i["key"] for i in items]
    dupes = {k for k in keys if keys.count(k) > 1}
    if dupes:
        sys.exit(f"duplicate keys: {sorted(dupes)}")
    return items


def fal(model, payload):
    req = urllib.request.Request(
        f"https://fal.run/{model}", data=json.dumps(payload).encode(),
        headers={"Authorization": f"Key {os.environ['FAL_API_KEY']}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.load(r)


def download(url):
    with urllib.request.urlopen(url, timeout=300) as r:
        return r.read()


def target(item):
    s = item["section"]
    if s == "sprite":
        return os.path.join("images", item["category"], item["key"] + ".png")
    if s == "background":
        return os.path.join("images", "backgrounds", item["key"] + ".jpg")
    if s == "sfx":
        return os.path.join("sounds", "sfx", item["key"] + ".mp3")
    return os.path.join("sounds", "music", item["key"] + ".mp3")


def make(item):
    s, desc = item["section"], item["description"]
    if s == "sprite":
        res = fal(SPRITE_MODEL, {"prompt": SPRITE_STYLE + desc, "background": "transparent", "image_size": "square_hd",
                                 "quality": "high", "output_format": "png", "reasoning_effort": "medium"})
        img = Image.open(io.BytesIO(download(res["images"][0]["url"]))).convert("RGBA")
        alpha = img.getchannel("A")
        if alpha.getextrema()[0] == 255:
            raise RuntimeError("no transparency in sprite output")
        img = img.crop(alpha.point(lambda a: 255 if a > 8 else 0).getbbox())
        img.thumbnail((512, 512), Image.LANCZOS)
        buf = io.BytesIO(); img.save(buf, "PNG", optimize=True)
        return buf.getvalue(), img.size, SPRITE_MODEL
    if s == "background":
        res = fal(BG_MODEL, {"prompt": BG_STYLE + desc, "aspect_ratio": "9:16", "resolution": "1K", "output_format": "png"})
        img = Image.open(io.BytesIO(download(res["images"][0]["url"]))).convert("RGB")
        img = img.resize((576, 1024), Image.LANCZOS)
        buf = io.BytesIO(); img.save(buf, "JPEG", quality=88, optimize=True)
        return buf.getvalue(), img.size, BG_MODEL
    if s == "sfx":
        res = fal(SFX_MODEL, {"text": desc + ", video game sound effect, clean, no music", "duration_seconds": max(0.5, item["duration"]),
                              "prompt_influence": 0.6, "output_format": "mp3_44100_128"})
        return download(res["audio"]["url"]), None, SFX_MODEL
    res = fal(MUSIC_MODEL, {"prompt": desc + ". Instrumental, seamless loop, consistent tempo, no intro or outro.",
                            "music_length_ms": 30000, "force_instrumental": True, "output_format": "mp3_44100_128"})
    return download(res["audio"]["url"]), None, MUSIC_MODEL


def run(item, force):
    path = os.path.join(OUT, target(item))
    if os.path.exists(path) and not force:
        return item, "skipped"
    for attempt in range(8):
        try:
            data, size, model = make(item)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "wb") as f:
                f.write(data)
            meta = {"model": model}
            if size:
                meta.update(width=size[0], height=size[1])
            with open(path + ".json", "w") as f:
                json.dump(meta, f)
            return item, "ok"
        except Exception as e:
            err = e
            time.sleep(min(60, 5 * 2 ** attempt) + random.random() * 5)
    return item, f"failed: {err}"


def write_manifest(items):
    assets = []
    for item in items:
        rel = target(item)
        path = os.path.join(OUT, rel)
        if not os.path.exists(path):
            continue
        meta = json.load(open(path + ".json"))
        entry = {"key": item["key"], "kind": "image" if item["section"] in ("sprite", "background") else "sound",
                 "source": "fal", "category": item["category"], "description": item["description"],
                 "file": rel.replace(os.sep, "/"), "model": meta["model"]}
        if "width" in meta:
            entry.update(width=meta["width"], height=meta["height"])
        assets.append(entry)
    with open(os.path.join(OUT, "manifest.json"), "w") as f:
        json.dump({"license": "Generated with fal.ai models for this project; see README.md", "assets": assets}, f, indent=2)
        f.write("\n")
    return len(assets)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--workers", type=int, default=16)
    args = ap.parse_args()
    items = parse_spec()
    todo = [i for i in items if not args.only or i["key"] in args.only.split(",")]
    failed = []
    with ThreadPoolExecutor(args.workers) as pool:
        for fut in as_completed([pool.submit(run, i, args.force) for i in todo]):
            item, status = fut.result()
            print(f"{item['key']}: {status}", flush=True)
            if status.startswith("failed"):
                failed.append(item["key"])
    print(f"manifest: {write_manifest(items)} assets; failed: {failed}")


if __name__ == "__main__":
    main()
