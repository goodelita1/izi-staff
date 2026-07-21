from io import BytesIO
from pathlib import Path

import qrcode
from PIL import Image, ImageDraw, ImageFont
from app.config.settings import settings

QR_DIR = Path(settings.database_path).parents[1] / "qr"
QR_SIZE = 10
QR_BORDER = 4


class QRService:
    def __init__(self) -> None:
        QR_DIR.mkdir(parents=True, exist_ok=True)

    def _path(self, inventory_number: str) -> Path:
        return QR_DIR / f"{inventory_number}.png"

    def _make_image(self, inventory_number: str, base_url: str = "http://localhost:5173") -> Image.Image:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=QR_SIZE,
            border=QR_BORDER,
        )
        qr.add_data(f"{base_url}/?search={inventory_number}")
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

        label_height = 30
        combined = Image.new(
            "RGB", (qr_img.width, qr_img.height + label_height), "white"
        )
        combined.paste(qr_img, (0, 0))

        draw = ImageDraw.Draw(combined)
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 14)
        except Exception:
            font = ImageFont.load_default()

        bbox = draw.textbbox((0, 0), inventory_number, font=font)
        text_w = bbox[2] - bbox[0]
        x = (combined.width - text_w) // 2
        draw.text((x, qr_img.height + 5), inventory_number, fill="black", font=font)

        return combined

    def generate(self, inventory_number: str) -> Path:
        path = self._path(inventory_number)
        img = self._make_image(inventory_number)
        img.save(str(path))
        return path

    def get_path(self, inventory_number: str) -> Path:
        path = self._path(inventory_number)
        if not path.exists():
            self.generate(inventory_number)
        return path

    def get_bytes(self, inventory_number: str, base_url: str = "http://localhost:5173") -> bytes:
        img = self._make_image(inventory_number, base_url)
        buf = BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

    def get_bulk_bytes(self, inventory_numbers: list[str], base_url: str = "http://localhost:5173") -> bytes:
        """Combine multiple QR images into a single PNG for printing."""
        images = [self._make_image(n, base_url) for n in inventory_numbers]
        if not images:
            return b""
        w = max(i.width for i in images)
        h = sum(i.height for i in images) + 10 * (len(images) - 1)
        combined = Image.new(
            "RGB",
            (w * min(len(images), 4), h // max(len(images) // 4, 1) + 40),
            "white",
        )

        cols = min(len(images), 4)
        cell_w = images[0].width
        cell_h = images[0].height
        for idx, img in enumerate(images):
            col = idx % cols
            row = idx // cols
            combined.paste(img, (col * cell_w, row * cell_h))

        buf = BytesIO()
        combined.save(buf, format="PNG")
        return buf.getvalue()
