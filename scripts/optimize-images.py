"""Create WebP copies of existing images without changing database originals.
Usage: python scripts/optimize-images.py --site http://127.0.0.1:8787
Optional: repeat --site to include the deployed site's current uploads.
Requires Pillow locally; no runtime dependency is added to the Worker.
"""
import argparse, base64, hashlib, io, json, re, urllib.request
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public/assets/optimized"
MANIFEST = ROOT / "src/lib/image-manifest.json"

def signature(source):
    value = 2166136261
    for char in source:
        value = ((value ^ ord(char)) * 16777619) & 0xffffffff
    return str(len(source)) + "-" + format(value, "08x")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", action="append", default=[])
    parser.add_argument("--d1-json", help="Optional read-only Wrangler JSON export of public image fields")
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    sources = set()
    for asset in (ROOT / "public/assets").iterdir():
        if asset.is_file() and asset.suffix.lower() in (".png", ".jpg", ".jpeg"):
            sources.add("/assets/" + asset.name)
    for site in args.site:
        try:
            with urllib.request.urlopen(site.rstrip("/") + "/api/site-data", timeout=15) as response:
                data = json.load(response)
            sources.add(data["profile"].get("photo", ""))
            for project in data.get("projects", []): sources.add(project.get("image") or "")
            for certificate in data.get("certifications", []): sources.add(certificate.get("imageUrl") or "")
            video = data["profile"].get("heroVideoUrl", "")
            match = re.search(r"(?:v=|shorts/|youtu.be/)([A-Za-z0-9_-]{11})", video)
            if match: sources.add("https://img.youtube.com/vi/" + match[1] + "/hqdefault.jpg")
        except Exception as error:
            print("Could not read", site, type(error).__name__)
    if args.d1_json:
        exported = json.loads(Path(args.d1_json).read_text(encoding="utf-8-sig"))
        for group in exported:
            for row in group.get("results", []):
                for key in ["image", "photo", "imageUrl"]:
                    if row.get(key): sources.add(row[key])
    for source in sources:
        if not source or source.startswith("data:image/svg") or source.startswith("/assets/optimized/"): continue
        try:
            if source.startswith("data:image/"):
                raw = base64.b64decode(source.split(",", 1)[1])
            elif source.startswith("/assets/"):
                file = (ROOT / "public" / source.lstrip("/")).resolve()
                if not file.is_relative_to((ROOT / "public/assets").resolve()): continue
                raw = file.read_bytes()
            elif source.startswith("https://img.youtube.com/"):
                with urllib.request.urlopen(source, timeout=12) as response: raw = response.read()
            else: continue
            image = ImageOps.exif_transpose(Image.open(io.BytesIO(raw)))
            if image.format == "WEBP" and source.startswith("data:"): continue
            image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
            name = hashlib.sha256(raw).hexdigest()[:20] + ".webp"
            lossy = io.BytesIO(); image.save(lossy, "WEBP", quality=84, method=6)
            lossless = io.BytesIO(); image.save(lossless, "WEBP", lossless=True, method=6)
            (OUTPUT / name).write_bytes(min([lossy.getvalue(), lossless.getvalue()], key=len))
            manifest[signature(source)] = {"src": "/assets/optimized/" + name, "width": image.width, "height": image.height}
            print("Optimized image:", len(raw), "->", (OUTPUT / name).stat().st_size, "bytes")
        except Exception as error:
            print("Skipped image:", type(error).__name__)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__": main()
