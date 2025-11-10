// 현재 언어 상태
let currentLanguage = 'kr';

function switchLanguage(lang) {
  currentLanguage = lang;
  const languageBtn = document.getElementById('languageBtn');
  const languageTexts = { kr: 'KR', jp: 'JP', en: 'EN' };
  languageBtn.textContent = languageTexts[lang];

  document.querySelectorAll('[data-kr]').forEach((element) => {
    const text = element.getAttribute(`data-${lang}`);
    if (text) element.innerHTML = text;
  });

  document.querySelectorAll('.steam-widget').forEach((widget) => {
    widget.style.display = widget.getAttribute('data-lang') === lang ? 'flex' : 'none';
  });

  document.getElementById('languageDropdown').classList.remove('show');
  localStorage.setItem('selectedLanguage', lang);
}

document.getElementById('languageBtn').addEventListener('click', function () {
  const dropdown = document.getElementById('languageDropdown');
  dropdown.classList.toggle('show');
});

document.querySelectorAll('.language-option').forEach((option) => {
  option.addEventListener('click', function () {
    const lang = this.getAttribute('data-lang');
    switchLanguage(lang);
  });
});

document.addEventListener('click', function (event) {
  const languageSelector = document.querySelector('.language-selector');
  if (!languageSelector.contains(event.target)) {
    document.getElementById('languageDropdown').classList.remove('show');
  }
});

window.addEventListener('error', function (e) {
  if (e.target.tagName === 'IMG' && e.target.src.includes('assets/screenshots/')) {
    e.preventDefault();
    return false;
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const savedLanguage = localStorage.getItem('selectedLanguage');
  if (savedLanguage && ['kr', 'jp', 'en'].includes(savedLanguage)) {
    switchLanguage(savedLanguage);
  } else {
    switchLanguage('kr');
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

function initializeGallery() {
  const slider = document.getElementById('gallery-slider');
  const dotsContainer = document.getElementById('gallery-dots');

  const imageFiles = getImageFiles();
  if (imageFiles.length === 0) return;

  imageFiles.forEach((filename, index) => {
    const slide = document.createElement('div');
    slide.className = `gallery-slide ${index === 0 ? 'active' : ''}`;
    const img = document.createElement('img');
    img.src = `assets/screenshots/${filename}`;
    img.alt = `게임 스크린샷 ${index + 1}`;
    img.className = 'gallery-image';
    slide.appendChild(img);
    slider.appendChild(slide);
  });

  imageFiles.forEach((_, index) => {
    const dot = document.createElement('span');
    dot.className = `dot ${index === 0 ? 'active' : ''}`;
    dot.onclick = () => currentSlide(index + 1);
    dotsContainer.appendChild(dot);
  });

  slides = document.querySelectorAll('.gallery-slide');
  dots = document.querySelectorAll('.dot');
}

function getImageFiles() {
  return ['0.jpg', '1.gif', '1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg'];
}

function showSlide(n) {
  slides.forEach((slide) => slide.classList.remove('active'));
  dots.forEach((dot) => dot.classList.remove('active'));
  if (n >= slides.length) currentSlideIndex = 0;
  if (n < 0) currentSlideIndex = slides.length - 1;
  slides[currentSlideIndex].classList.add('active');
  dots[currentSlideIndex].classList.add('active');
}

function changeSlide(n) { currentSlideIndex += n; showSlide(currentSlideIndex); }
function currentSlide(n) { currentSlideIndex = n - 1; showSlide(currentSlideIndex); }

function autoSlide() { currentSlideIndex++; showSlide(currentSlideIndex); }
// setInterval(autoSlide, 5000);

window.addEventListener('scroll', function () {
  const header = document.querySelector('header');
  header.style.background = window.scrollY > 100 ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)';
});


