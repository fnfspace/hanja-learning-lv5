let hanjaData = [];

let currentIndex = 0;
let currentStage = 1; // 현재 단계 기억

function shuffleHanja() {
  for (let i = hanjaData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [hanjaData[i], hanjaData[j]] = [hanjaData[j], hanjaData[i]];
  }
  currentIndex = 0; // 섞은 후 첫 글자부터 시작
}

document.addEventListener("DOMContentLoaded", async () => {
  hanjaData = await loadData();   // CSV에서 데이터 로드

  // 주차 정보 탭 제목에 표시
  updateTabTitle();

  const shuffleIcon = document.getElementById("shuffle-icon");
  if (shuffleIcon) {
    shuffleIcon.onclick = () => {
      shuffleHanja();
      shuffleIcon.classList.add("shake");
      setTimeout(() => shuffleIcon.classList.remove("shake"), 500);
      if (currentStage > 0) {
        showCurrentStage();
      }
    };
  }
});

// URL 파라미터에서 week 값 읽기
function getWeekParam() {
  const params = new URLSearchParams(window.location.search);
  return params.get("week") || "Week01"; // 기본값 Week01
}

// 마스터 시트 로드
async function loadMasterSheet() {
  const response = await fetch("master_week-1-50.csv");
  const text = await response.text();
  const lines = text.trim().split("\n");
  return lines; // 각 행이 주차별 데이터
}

// 특정 주차 데이터 파싱
function parseWeekData(line) {
  const parts = line.split(",");
  const allData = [];

  for (let i = 0; i < parts.length; i += 3) {
    const char = parts[i]?.trim();
    const readingRaw = parts[i + 1]?.trim();
    const level = parts[i + 2]?.trim();

    if (char) {
      // 음훈이 여러 개일 경우 '|'로 분리해서 배열로 저장
      const readings = readingRaw.split("|").map(r => r.trim());
      allData.push({ char, readings, level });
    }
  }

  return allData;
}

// 최종 호출
async function loadData() {
  const week = getWeekParam(); // 예: "Week01"
  const weekIndex = parseInt(week.replace("Week", ""), 10) - 1; // Week01 → 0행
  const lines = await loadMasterSheet();
  const line = lines[weekIndex];
  return parseWeekData(line);
}

function updateTabTitle() {
  const week = getWeekParam(); // 예: "Week45"
  const weekNumber = parseInt(week.replace("Week", ""), 10); // → 45
  document.title = `한자 학습 프로그램 - ${weekNumber}주차`;
}

function startStage(stageNum) {
  currentStage = stageNum;
  currentIndex = 0; // 새 단계 시작 시 첫 글자부터

  document.getElementById('home').classList.add('hidden');
  document.getElementById('stage').classList.remove('hidden');

  const title = document.getElementById('stage-main-title');
  const subtitle = document.getElementById('stage-subtitle');
  const content = document.getElementById('stage-content');

  content.innerHTML = "";

  switch(stageNum) {
    case 1:
      title.innerText = "1단계: 한자 애니메이션";
      subtitle.innerText = "획순 애니메이션과 음훈 보기";
      showStage1(hanjaData[currentIndex]);
      break;
    case 2:
      title.innerText = "2단계: 한자 → 음훈 퀴즈";
      subtitle.innerText = "한자를 보고 올바른 음훈을 선택하세요.";
      showStage2(hanjaData[currentIndex], hanjaData);
      break;
    case 3:
      title.innerText = "3단계: 음훈 → 한자 퀴즈";
      subtitle.innerText = "음훈을 보고 올바른 한자를 선택하세요.";
      showStage3(hanjaData[currentIndex], hanjaData);
      break;
    case 4:
      title.innerText = "4단계: 암기카드";
      subtitle.innerText = "한자와 음훈을 번갈아 확인하세요.";
      showStage4(hanjaData);
      break;
  }
}

function goHome() {
  document.getElementById('home').classList.remove('hidden');
  document.getElementById('stage').classList.add('hidden');
}

// 진행 상황 표시 (텍스트 방식)
function updateProgress() {
  let progressDiv = document.getElementById("progress");
  if (!progressDiv) {
    progressDiv = document.createElement("div");
    progressDiv.id = "progress";
    progressDiv.className = "progress-indicator";
    document.getElementById("stage").insertBefore(progressDiv, document.getElementById("stage-content"));
  }
  progressDiv.textContent = `${currentIndex + 1} / ${hanjaData.length}`;
}

// 네비게이션 화살표
function hideArrows() {
  document.getElementById("prevArrow").style.visibility = "hidden";
  document.getElementById("nextArrow").style.visibility = "hidden";
}

function showArrows() {
  updateArrows();
}

function updateArrows() {
  const prevArrow = document.getElementById("prevArrow");
  const nextArrow = document.getElementById("nextArrow");

  if (currentIndex > 0) {
    prevArrow.style.visibility = "visible";
    prevArrow.onclick = () => {
      currentIndex--;
      showCurrentStage();
    };
  } else {
    prevArrow.style.visibility = "hidden";
    prevArrow.onclick = null;
  }

  if (currentIndex < hanjaData.length - 1) {
    nextArrow.style.visibility = "visible";
    nextArrow.onclick = () => {
      currentIndex++;
      showCurrentStage();
    };
  } else {
    nextArrow.style.visibility = "hidden";
    nextArrow.onclick = null;
  }
}

// 현재 단계 화면 다시 표시
function showCurrentStage() {
  switch (currentStage) {
    case 1:
      showStage1(hanjaData[currentIndex]);
      break;
    case 2:
      showStage2(hanjaData[currentIndex], hanjaData);
      break;
    case 3:
      showStage3(hanjaData[currentIndex], hanjaData);
      break;
    case 4:
      showStage4(hanjaData);
      break;
  }
}

// 1단계: 한자 애니메이션 (모바일 대응)
function showStage1(charObj) {
  const stageContent = document.getElementById("stage-content");
  stageContent.innerHTML = "";

  if (!charObj) return;

  updateProgress();
  hideArrows();
  document.querySelector(".stage4-controls").classList.add("hidden");

  // 컨테이너 생성
  const container = document.createElement("div");
  container.className = "hanja-container";

  // 한자 애니메이션 영역
  const hanziDiv = document.createElement("div");
  hanziDiv.id = "hanzi-character";
  container.appendChild(hanziDiv);

  // 음훈 표시
  const readingDiv = document.createElement("div");
  readingDiv.className = "hanja-reading";
  readingDiv.innerHTML = charObj.readings.map(r => r.trim()).join("<br>");
  readingDiv.style.visibility = "hidden";
  container.appendChild(readingDiv);

  // 급수 표시
  const levelDiv = document.createElement("div");
  levelDiv.className = "hanja-level";
  levelDiv.textContent = `급수: ${charObj.level}`;
  levelDiv.style.visibility = "hidden";
  container.appendChild(levelDiv);

  stageContent.appendChild(container);

  // 화면 크기 체크 → 모바일이면 작게
  const isMobileLandscape = window.matchMedia("(max-width: 1080px) and (orientation: landscape)").matches;
  const size = isMobileLandscape ? 200 : 500;

  // HanziWriter 애니메이션
  const writer = HanziWriter.create('hanzi-character', charObj.char, {
    width: size,
    height: size,
    strokeColor: '#2C3E50',
    showOutline: true
  });

  writer.animateCharacter().then(() => {
    readingDiv.style.visibility = "visible";
    levelDiv.style.visibility = "visible";
    showArrows();
  });
}


// 2단계: 한자 → 음훈 퀴즈
function showStage2(charObj, allData) {
  const stageContent = document.getElementById("stage-content");
  stageContent.innerHTML = "";

  if (!charObj) return;

  updateProgress();
  hideArrows();
  document.querySelector(".stage4-controls").classList.add("hidden");

  const container = document.createElement("div");
  container.className = "stage2-container";

  // 문제: 한자 표시
  const hanjaDiv = document.createElement("div");
hanjaDiv.className = "stage2-hanja hanja-font";
  hanjaDiv.textContent = charObj.char;
  container.appendChild(hanjaDiv);

  // 보기 영역
  const optionsContainer = document.createElement("div");
  optionsContainer.className = "stage2-options";

  const correctReadings = charObj.readings;

  // 더미 보기: 다른 글자의 readings
  let dummyOptions = allData
    .filter(item => item.char !== charObj.char)
    .map(item => item.readings.join(", "));

  dummyOptions = dummyOptions.sort(() => Math.random() - 0.5).slice(0, 3);

  const allOptions = [correctReadings.join(", "), ...dummyOptions].sort(() => Math.random() - 0.5);

  allOptions.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "stage2-option";
    btn.textContent = opt;

    btn.onclick = () => {
      if (opt === correctReadings.join(", ")) {
        btn.classList.add("correct-circle");
        setTimeout(() => {
          if (currentIndex < allData.length - 1) {
            currentIndex++;
            showStage2(allData[currentIndex], allData);
          } else {
            showArrows();
          }
        }, 1500);
      } else {
        btn.classList.add("wrong-square");
      }
    };

    optionsContainer.appendChild(btn);
  });

  container.appendChild(optionsContainer);
  stageContent.appendChild(container);

  setTimeout(() => showArrows(), 500);
}

// 3단계: 음훈 → 한자 퀴즈
function showStage3(charObj, allData) {
  const stageContent = document.getElementById("stage-content");
  stageContent.innerHTML = "";

  if (!charObj) return;

  updateProgress();
  hideArrows();
  document.querySelector(".stage4-controls").classList.add("hidden");

  const container = document.createElement("div");
  container.className = "stage3-container";

  // 문제: 음훈 표시
  const readingDiv = document.createElement("div");
  readingDiv.className = "stage3-reading";
  readingDiv.textContent = charObj.readings.join(", ");
  container.appendChild(readingDiv);

  // 보기 영역
  const optionsContainer = document.createElement("div");
  optionsContainer.className = "stage3-options";

  const correct = charObj.char;

  let dummyOptions = allData
    .filter(item => item.char !== correct)
    .map(item => item.char);

  dummyOptions = dummyOptions.sort(() => Math.random() - 0.5).slice(0, 3);

  const allOptions = [correct, ...dummyOptions].sort(() => Math.random() - 0.5);

  allOptions.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "stage3-option hanja-font";
    btn.textContent = opt;

    btn.onclick = () => {
      if (opt === correct) {
        btn.classList.add("correct-circle");
        setTimeout(() => {
          if (currentIndex < allData.length - 1) {
            currentIndex++;
            showStage3(allData[currentIndex], allData);
          } else {
            showArrows();
          }
        }, 1500);
      } else {
        btn.classList.add("wrong-square");
      }
    };

    optionsContainer.appendChild(btn);
  });

  container.appendChild(optionsContainer);
  stageContent.appendChild(container);

  setTimeout(() => showArrows(), 500);
}

// 4단계: 암기카드
function showStage4(allData) {
  const stageContent = document.getElementById("stage-content");
  stageContent.innerHTML = "";

  updateProgress();
  hideArrows();

  const controls = document.querySelector(".stage4-controls");
  controls.classList.remove("hidden");

  const shuffleBtn = document.getElementById("shuffle-btn");
  const toggleBtn = document.getElementById("toggle-btn");
  const container = document.createElement("div");
  container.className = "stage4-container";
  stageContent.appendChild(container);

  let showReading = false;

  function renderCards(data, target, showReading = false) {
    target.innerHTML = "";
    data.forEach(item => {
      const card = document.createElement("div");
      card.className = "stage4-card hanja-font " + (showReading ? "reading-card" : "hanja-card");
      card.textContent = showReading ? item.readings.join(", ") : item.char;

      // 여러 음훈을 줄바꿈으로 표시
      card.innerHTML = showReading 
        ? item.readings.map(r => r.trim()).join("<br>")
        : item.char;

      card.onclick = () => {
        if (card.classList.contains("hanja-card")) {
          card.innerHTML = item.readings.map(r => r.trim()).join("<br>");
          card.classList.remove("hanja-card");
          card.classList.add("reading-card");
        } else {
          card.textContent = item.char;
          card.classList.remove("reading-card");
          card.classList.add("hanja-card");
        }
      };

      target.appendChild(card);
    });
  }

  shuffleBtn.onclick = () => {
    allData.sort(() => Math.random() - 0.5);
    renderCards(allData, container, showReading);
  };

  toggleBtn.onclick = () => {
    showReading = !showReading;
    renderCards(allData, container, showReading);
  };

  renderCards(allData, container, showReading);
}


