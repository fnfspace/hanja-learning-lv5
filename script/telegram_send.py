import requests
import json
import datetime
import os

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

# 현재 스크립트 위치 기준으로 img 폴더 절대 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(BASE_DIR, "..", "img")

def send_photo(photo_path, caption, spoiler=False):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendPhoto"
    data = {"chat_id": CHAT_ID, "caption": caption, "parse_mode": "HTML"}
    if spoiler:
        data["has_spoiler"] = True
    with open(photo_path, "rb") as photo:
        response = requests.post(url, data=data, files={"photo": photo})
    print(response.json())

def main():
    # 한국 표준시(KST, UTC+9) 기준 당일 날짜 구하기
    kst = datetime.timezone(datetime.timedelta(hours=9))
    today = datetime.datetime.now(kst).date().isoformat()
    # 07시47분=review_hanja, 09시47분=review_eumhun, 11시47분=new_hanja (GitHub Actions 트리거 시각 기준)
    slot = os.getenv("SLOT", "all")

    with open(os.path.join(BASE_DIR, "schedule.json"), "r", encoding="utf-8") as f:
        schedule = json.load(f)

    if today not in schedule:
        print("오늘은 발송할 메시지가 없습니다.")
        return

    # 신규 학습 발송 (오전 11시47분)
    if slot in ("new_hanja", "all"):
        for week in schedule[today].get("new", []):
            link = f"https://fnfspace.github.io/hanja-learning-lv5/index.html?week=Week{week}"
            hanja_path = os.path.join(IMG_DIR, f"week{week}_hanja.png")
            send_photo(hanja_path, f'📘 Week{week} 신규 학습\n<a href="{link}">🔗 바로가기</a>')

    # 복습 한자 발송 (오전 7시47분), 이어서 음훈 이미지를 스포일러로 발송
    if slot in ("review_hanja", "all"):
        for week in schedule[today].get("review", []):
            link = f"https://fnfspace.github.io/hanja-learning-lv5/index.html?week=Week{week}"
            hanja_path = os.path.join(IMG_DIR, f"week{week}_hanja.png")
            eumhun_path = os.path.join(IMG_DIR, f"week{week}_eumhun.png")
            send_photo(hanja_path, f'🔁 Week{week} 복습 (한자)\n<a href="{link}">🔗 바로가기</a>')
            send_photo(eumhun_path, f'🙈 Week{week} 음훈 정답 (터치해서 확인)', spoiler=True)

    # 복습 음훈 발송 (오전 9시47분), 이어서 한자 이미지를 스포일러로 발송
    if slot in ("review_eumhun", "all"):
        for week in schedule[today].get("review", []):
            link = f"https://fnfspace.github.io/hanja-learning-lv5/index.html?week=Week{week}"
            eumhun_path = os.path.join(IMG_DIR, f"week{week}_eumhun.png")
            hanja_path = os.path.join(IMG_DIR, f"week{week}_hanja.png")
            send_photo(eumhun_path, f'🔁 Week{week} 복습 (음훈)\n<a href="{link}">🔗 바로가기</a>')
            send_photo(hanja_path, f'🙈 Week{week} 한자 정답 (터치해서 확인)', spoiler=True)

if __name__ == "__main__":
    main()
