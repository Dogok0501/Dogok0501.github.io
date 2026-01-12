// 현재 언어 상태
let currentLanguage = 'en';

const YOUTUBE_PV_URLS = {
  kr: 'https://youtu.be/NesuOj2yv0s',
  jp: 'https://youtu.be/Qs5en3ha-TM',
  en: 'https://youtu.be/f0XqAYuUwcQ',
  tc: 'https://youtu.be/xmSGJOEm09w',
  sc: 'https://youtu.be/yfXLDTOam4k'
};

function switchLanguage(lang) {
  currentLanguage = lang;
  
  // HTML lang 속성 업데이트
  const langMap = {
    kr: 'ko',
    jp: 'ja',
    en: 'en',
    sc: 'zh-CN',
    tc: 'zh-CN'
  };
  document.documentElement.lang = langMap[lang] || lang;
  
  // 폰트 설정 업데이트
  if (lang === 'sc') {
    document.body.classList.add('lang-zh');
    document.body.classList.remove('lang-tc', 'lang-jp');
  } else if (lang === 'tc') {
    document.body.classList.add('lang-tc');
    document.body.classList.remove('lang-zh', 'lang-jp');
  } else if (lang === 'jp') {
    document.body.classList.add('lang-jp');
    document.body.classList.remove('lang-zh', 'lang-tc');
  } else {
    document.body.classList.remove('lang-zh', 'lang-tc', 'lang-jp');
  }

  // 버튼 및 모바일 버튼 텍스트 업데이트
  const languageTexts = { 
    kr: '한국어', 
    jp: '日本語', 
    en: 'English', 
    sc: '简体中文', 
    tc: '繁體中文' 
  };
  const mobileBtn = document.getElementById('mobileLangBtn');
  if (mobileBtn) {
    mobileBtn.textContent = languageTexts[lang] || lang.toUpperCase();
  }

  document.querySelectorAll('.language-option').forEach(btn => {
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 모바일 드롭다운 닫기
  const languageList = document.getElementById('languageList');
  if (languageList) {
    languageList.classList.remove('show');
  }

  // 설명 이미지 변경
  const heroDescImg = document.getElementById('heroDescImg');
  if (heroDescImg) {
    heroDescImg.src = `assets/desc/desc_${lang}.png`;
    // 언어가 en일 때만 높이를 3vh로 설정, 그 외에는 2vh
    if (lang === 'en') {
      heroDescImg.style.height = '2vh';
    } else {
      heroDescImg.style.height = '3vh';
    }
  }

  document.querySelectorAll('[data-kr]').forEach((element) => {
    const text = element.getAttribute(`data-${lang}`);
    if (text) element.innerHTML = text;
  });

  document.querySelectorAll('.steam-widget').forEach((widget) => {
    widget.style.display = widget.getAttribute('data-lang') === lang ? 'flex' : 'none';
  });

  // 갤러리 유튜브 영상 업데이트 (HTML에 이미 존재하는 iframe들 제어)
  document.querySelectorAll('.gallery-youtube').forEach(iframe => {
    if (iframe.getAttribute('data-lang') === lang) {
      iframe.style.display = 'block';
    } else {
      iframe.style.display = 'none';
      // 비활성화된 영상은 정지 시도 (API 로드된 경우)
      if (youtubePlayers[iframe.id] && typeof youtubePlayers[iframe.id].pauseVideo === 'function') {
        try {
          youtubePlayers[iframe.id].pauseVideo();
        } catch (e) {}
      }
    }
  });

  // 갤러리 스크린샷 업데이트
  document.querySelectorAll('.gallery-image[data-is-lang-specific="true"]').forEach((img) => {
    const screenshotId = img.getAttribute('data-screenshot-id');
    img.src = `assets/screenshots/${lang}/${screenshotId}.jpg`;
  });

  localStorage.setItem('selectedLanguage', lang);
}

document.querySelectorAll('.language-option').forEach((option) => {
  option.addEventListener('click', function () {
    const lang = this.getAttribute('data-lang');
    switchLanguage(lang);
  });
});

// 모바일 언어 선택 토글
const mobileLangBtn = document.getElementById('mobileLangBtn');
if (mobileLangBtn) {
  mobileLangBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    const languageList = document.getElementById('languageList');
    languageList.classList.toggle('show');
  });
}

// 외부 클릭 시 드롭다운 닫기
document.addEventListener('click', function (event) {
  const languageList = document.getElementById('languageList');
  const mobileLangBtn = document.getElementById('mobileLangBtn');
  if (languageList && mobileLangBtn && !languageList.contains(event.target) && !mobileLangBtn.contains(event.target)) {
    languageList.classList.remove('show');
  }
});

window.addEventListener('error', function (e) {
  if (e.target.tagName === 'IMG' && e.target.src.includes('assets/screenshots/')) {
    e.preventDefault();
    return false;
  }
});

// YouTube IFrame API가 로드될 때 호출되는 전역 함수
window.onYouTubeIframeAPIReady = function() {
  // API가 로드된 후 이미 생성된 iframe에 대해 플레이어 초기화
  if (slides.length > 0) {
    slides.forEach((slide) => {
      slide.querySelectorAll('.gallery-youtube').forEach(iframe => {
        const iframeId = iframe.id;
        if (!youtubePlayers[iframeId]) {
          if (iframe.src && iframe.src.includes('youtube.com')) {
            youtubePlayers[iframeId] = new YT.Player(iframeId, {
              events: {
                'onReady': function(event) {
                  // 플레이어 준비 완료
                }
              }
            });
          }
        }
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', function () {
  const savedLanguage = localStorage.getItem('selectedLanguage');
  if (savedLanguage && ['kr', 'jp', 'en', 'sc', 'tc'].includes(savedLanguage)) {
    switchLanguage(savedLanguage);
  } else {
    switchLanguage('en');
  }

  initializeGallery();

  const video = document.querySelector('.hero-bg-video');
  if (video) {
    video.addEventListener('ended', function () {
      this.currentTime = 0;
      this.play();
    });
    video.addEventListener('loadeddata', function () { this.play(); });
    video.addEventListener('pause', function () { this.play(); });
  }
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

let currentSlideIndex = 0;
let slides = [];
let dots = [];
let youtubePlayers = {}; // YouTube IFrame API 플레이어 객체 저장

function initializeGallery() {
  const slider = document.getElementById('gallery-slider');
  const dotsContainer = document.getElementById('gallery-dots');

  const galleryItems = getGalleryItems();
  
  // 이미지들만 추가로 생성하여 붙임
  galleryItems.forEach((item, index) => {
    if (item.type === 'image') {
      const slide = document.createElement('div');
      slide.className = `gallery-slide`;
      
      const img = document.createElement('img');
      if (item.isLangSpecific) {
        img.src = `assets/screenshots/${currentLanguage}/${item.filename}`;
        img.setAttribute('data-is-lang-specific', 'true');
        img.setAttribute('data-screenshot-id', item.filename.split('.')[0]);
      } else {
        img.src = `assets/screenshots/${item.filename}`;
      }
      img.alt = `게임 스크린샷 ${index + 1}`;
      img.className = 'gallery-image';
      slide.appendChild(img);
      slider.appendChild(slide);
    }
  });

  galleryItems.forEach((_, index) => {
    // 유튜브 슬라이드가 인덱스 0이므로 +1 해서 도트 생성
    const dot = document.createElement('span');
    dot.className = `dot ${index === 0 ? 'active' : ''}`;
    dot.onclick = () => currentSlide(index + 1);
    dotsContainer.appendChild(dot);
  });

  slides = document.querySelectorAll('.gallery-slide');
  dots = document.querySelectorAll('.dot');

  // API가 이미 로드되어 있다면 플레이어 초기화 트리거
  if (typeof YT !== 'undefined' && YT.Player) {
    window.onYouTubeIframeAPIReady();
  }
}

function getGalleryItems() {
  return [
    // 유튜브는 HTML에 직접 작성했으므로 이미지들만 반환
    { type: 'youtube' }, // 도트 개수 유지를 위한 더미
    { type: 'image', filename: '1.jpg', isLangSpecific: false },
    { type: 'image', filename: '2.jpg', isLangSpecific: false },
    { type: 'image', filename: '3.jpg', isLangSpecific: true },
    { type: 'image', filename: '4.jpg', isLangSpecific: true },
    { type: 'image', filename: '5.jpg', isLangSpecific: true },
    { type: 'image', filename: '6.jpg', isLangSpecific: true }
  ];
}

function extractYoutubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function getImageFiles() {
  return ['0.jpg', '1.gif', '1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg'];
}

function showSlide(n) {
  // 이전 슬라이드의 모든 유튜브 영상 중단
  slides.forEach((slide, index) => {
    if (slide.classList.contains('active')) {
      slide.querySelectorAll('.gallery-youtube').forEach(iframe => {
        const iframeId = iframe.id;
        if (youtubePlayers[iframeId] && typeof youtubePlayers[iframeId].pauseVideo === 'function') {
          try {
            youtubePlayers[iframeId].pauseVideo();
          } catch (e) {}
        }
      });
    }
  });

  slides.forEach((slide) => slide.classList.remove('active'));
  dots.forEach((dot) => dot.classList.remove('active'));
  if (n >= slides.length) currentSlideIndex = 0;
  if (n < 0) currentSlideIndex = slides.length - 1;
  
  // 새 슬라이드 활성화
  const newSlide = slides[currentSlideIndex];
  newSlide.classList.add('active');
  dots[currentSlideIndex].classList.add('active');
  
  // 새 슬라이드의 유튜브 영상들 처리
  newSlide.querySelectorAll('.gallery-youtube').forEach(iframe => {
    const youtubeUrl = iframe.getAttribute('data-youtube-url');
    const youtubeId = iframe.getAttribute('data-youtube-id');
    const iframeId = iframe.id;
    
    if (youtubeUrl && youtubeId) {
      if (!iframe.src || !iframe.src.includes(youtubeId)) {
        iframe.src = youtubeUrl;
      }
      
      if (!youtubePlayers[iframeId] && typeof YT !== 'undefined' && YT.Player) {
        if (iframe.style.display !== 'none') {
          iframe.addEventListener('load', function() {
            if (!youtubePlayers[iframeId]) {
              youtubePlayers[iframeId] = new YT.Player(iframeId, {
                events: { 'onReady': function(event) {} }
              });
            }
          }, { once: true });
        }
      }
    }
  });
}

function changeSlide(n) { currentSlideIndex += n; showSlide(currentSlideIndex); }
function currentSlide(n) { currentSlideIndex = n - 1; showSlide(currentSlideIndex); }

function autoSlide() { currentSlideIndex++; showSlide(currentSlideIndex); }
// setInterval(autoSlide, 5000);

window.addEventListener('scroll', function () {
  const header = document.querySelector('header');
//  header.style.background = window.scrollY > 100 ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)';
});


