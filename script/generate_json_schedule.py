import json
import datetime

# 신규 학습 시작일 (예: 2026-09-07 월요일)
start_date = datetime.date(2026, 9, 7)

# 신규 학습 요일: 월/수/금
new_days = [0, 2, 4]  # Monday=0, Wednesday=2, Friday=4

# 복습 간격
review_offsets = [1, 3, 7, 14, 28]

schedule = {}

week_num = 1
lesson_num = 1

# 50회차 신규 학습 생성
while lesson_num <= 50:
    for weekday in range(7):
        current_date = start_date + datetime.timedelta(days=(week_num-1)*7 + weekday)
        if weekday in new_days and lesson_num <= 50:
            # 신규 학습
            date_str = current_date.isoformat()
            if date_str not in schedule:
                schedule[date_str] = {"new": [], "review": []}
            schedule[date_str]["new"].append(f"{lesson_num:02d}")

            # 복습 일정 추가
            for offset in review_offsets:
                review_date = current_date + datetime.timedelta(days=offset)
                review_str = review_date.isoformat()
                if review_str not in schedule:
                    schedule[review_str] = {"new": [], "review": []}
                schedule[review_str]["review"].append(f"{lesson_num:02d}")

            lesson_num += 1

    week_num += 1

# JSON 저장
with open("schedule.json", "w", encoding="utf-8") as f:
    json.dump(schedule, f, indent=2, ensure_ascii=False)

print("✅ schedule.json 생성 완료")
