import argparse
import csv
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT_DIR = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT_DIR / "master_week-1-50.csv"
OUTPUT_DIR = ROOT_DIR / "img"
IMAGE_WIDTH = 1600
IMAGE_HEIGHT = 1000
GRID_COLUMNS = 5
GRID_ROWS = 2
CELL_WIDTH = IMAGE_WIDTH // GRID_COLUMNS
CELL_HEIGHT = IMAGE_HEIGHT // GRID_ROWS


def find_font(size):
    font_candidates = [
        Path(os.environ.get("WINDIR", r"C:\Windows")) / "Fonts" / "gulim.ttc",
        Path(os.environ.get("WINDIR", r"C:\Windows")) / "Fonts" / "gulim.ttf",
        Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"),
        Path("/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc"),
    ]

    for font_path in font_candidates:
        if font_path.exists():
            return ImageFont.truetype(str(font_path), size)

    raise FileNotFoundError(
        "한글을 지원하는 글꼴을 찾을 수 없습니다. "
        "Windows에서는 굴림(gulim.ttc)을 설치해 주세요."
    )


def load_weeks():
    with CSV_PATH.open("r", encoding="utf-8-sig", newline="") as csv_file:
        rows = list(csv.reader(csv_file))

    weeks = []
    for row_number, row in enumerate(rows, start=1):
        if len(row) != 30:
            raise ValueError(
                f"{row_number}행의 필드 수가 {len(row)}개입니다. 30개여야 합니다."
            )

        entries = []
        for index in range(0, len(row), 3):
            hanja = row[index].strip()
            reading = row[index + 1].strip()
            if not hanja or not reading:
                raise ValueError(f"{row_number}행 {index // 3 + 1}번째 항목이 비어 있습니다.")

            entries.append(
                {
                    "hanja": hanja,
                    "readings": [item.strip() for item in reading.split("|")],
                }
            )
        weeks.append(entries)

    return weeks


def draw_grid(entries, content_type, output_path):
    image = Image.new("RGB", (IMAGE_WIDTH, IMAGE_HEIGHT), "white")
    draw = ImageDraw.Draw(image)
    hanja_font = find_font(170)
    reading_font = find_font(52)

    for index, entry in enumerate(entries):
        row = index // GRID_COLUMNS
        column = index % GRID_COLUMNS
        left = column * CELL_WIDTH
        top = row * CELL_HEIGHT
        right = left + CELL_WIDTH
        bottom = top + CELL_HEIGHT

        draw.rectangle((left, top, right, bottom), outline="#b8b8b8", width=3)

        if content_type == "hanja":
            text = entry["hanja"]
            font = hanja_font
            box = draw.textbbox((0, 0), text, font=font)
            text_width = box[2] - box[0]
            text_height = box[3] - box[1]
            position = (
                left + (CELL_WIDTH - text_width) // 2,
                top + (CELL_HEIGHT - text_height) // 2 - box[1],
            )
            draw.text(position, text, fill="#111111", font=font)
        else:
            lines = entry["readings"]
            line_heights = [draw.textbbox((0, 0), line, font=reading_font)[3] for line in lines]
            total_height = sum(line_heights) + max(0, len(lines) - 1) * 16
            current_top = top + (CELL_HEIGHT - total_height) // 2
            for line, line_height in zip(lines, line_heights):
                box = draw.textbbox((0, 0), line, font=reading_font)
                line_width = box[2] - box[0]
                position = (
                    left + (CELL_WIDTH - line_width) // 2,
                    current_top - box[1],
                )
                draw.text(position, line, fill="#111111", font=reading_font)
                current_top += line_height + 16

    image.save(output_path, format="PNG")


def parse_week_numbers(values, total_weeks):
    if not values:
        return range(1, total_weeks + 1)

    week_numbers = []
    for value in values:
        week_number = int(value)
        if week_number < 1 or week_number > total_weeks:
            raise ValueError(f"주차는 1부터 {total_weeks} 사이여야 합니다: {week_number}")
        week_numbers.append(week_number)
    return week_numbers


def main():
    parser = argparse.ArgumentParser(description="CSV에서 주차별 한자/음훈 PNG를 생성합니다.")
    parser.add_argument(
        "--weeks",
        nargs="+",
        type=int,
        help="생성할 주차 번호. 생략하면 전체 주차를 생성합니다.",
    )
    args = parser.parse_args()

    weeks = load_weeks()
    week_numbers = parse_week_numbers(args.weeks, len(weeks))

    for week_number in week_numbers:
        entries = weeks[week_number - 1]
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        hanja_path = OUTPUT_DIR / f"week{week_number:02d}_hanja.png"
        eumhun_path = OUTPUT_DIR / f"week{week_number:02d}_eumhun.png"
        draw_grid(entries, "hanja", hanja_path)
        draw_grid(entries, "readings", eumhun_path)
        print(f"week{week_number:02d}: {hanja_path}, {eumhun_path}")


if __name__ == "__main__":
    main()