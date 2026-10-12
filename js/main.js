// Руслан Романов — лендинг. Скрипты: мобильное меню + отправка формы.

(function () {
  'use strict';

  // ---- Мобильное меню ----
  var navToggle = document.getElementById('navToggle');
  var navPanel = document.getElementById('navMobilePanel');

  if (navToggle && navPanel) {
    navToggle.addEventListener('click', function () {
      var isOpen = navPanel.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Закрыть меню при клике на любую ссылку внутри панели
    navPanel.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navPanel.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---- Отправка формы через Formspree (AJAX, без перезагрузки страницы) ----
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');

  if (form && status) {
    var submitBtn = form.querySelector('button[type="submit"]');
    var originalLabel = submitBtn.textContent;
    var agreeBoxes = form.querySelectorAll('.agree-row input[type="checkbox"]');
    var allAgreed = function () {
      return Array.prototype.every.call(agreeBoxes, function (cb) { return cb.checked; });
    };

    // Кнопка «Отправить» активна только когда оба чекбокса согласия отмечены
    var updateSubmitState = function () {
      submitBtn.disabled = !allAgreed();
    };

    if (agreeBoxes.length) {
      agreeBoxes.forEach(function (cb) {
        cb.addEventListener('change', updateSubmitState);
      });
      updateSubmitState();
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      // Доп. проверка на случай, если кнопка стала кликабельной в обход обычной логики
      // (например, из-за стороннего расширения браузера) — блокируем отправку без согласий.
      if (agreeBoxes.length && !allAgreed()) {
        updateSubmitState();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправляю…';
      status.className = 'form-status';
      status.textContent = '';

      var data = new FormData(form);

      fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      })
        .then(function (response) {
          if (response.ok) {
            status.textContent = 'Спасибо! Сообщение отправлено — отвечу в течение одного-двух рабочих дней.';
            status.className = 'form-status is-visible is-success';
            form.reset();
          } else {
            return response.json().then(function (json) {
              throw new Error((json && json.errors) ? json.errors.map(function (e) { return e.message; }).join(', ') : 'Ошибка отправки');
            });
          }
        })
        .catch(function () {
          status.textContent = 'Не получилось отправить форму. Попробуйте ещё раз чуть позже или обновите страницу.';
          status.className = 'form-status is-visible is-error';
        })
        .finally(function () {
          submitBtn.textContent = originalLabel;
          updateSubmitState();
        });
    });
  }

  // ---- Плавное появление карточек при скролле ----
  var prefersReducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          // Анимация повторяется при каждом входе/выходе карточки из зоны видимости
          // (а не только один раз) — так решил клиент.
          entry.target.classList.toggle('is-visible', entry.isIntersecting);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

      revealEls.forEach(function (el) { revealObserver.observe(el); });
    }
  }

  // ---- Счётчик цифр в блоке статистики hero (-27% / 3.2x / +16%) ----
  // Как и карточки выше — считает заново при каждом входе в зону видимости
  // (а не один раз), включая повторный скролл вниз после возврата наверх.
  var heroStatNums = document.querySelectorAll('.hero-stat-num');

  if (heroStatNums.length && !prefersReducedMotion && 'IntersectionObserver' in window) {
    var statAnimTokens = new WeakMap();

    var parseStat = function (raw) {
      var match = raw.match(/^([+\-]?)([\d]*\.?[\d]+)(.*)$/);
      if (!match) { return null; }
      return {
        sign: match[1] || '',
        numStr: match[2],
        suffix: match[3] || '',
        decimals: match[2].indexOf('.') > -1 ? match[2].split('.')[1].length : 0
      };
    };

    var animateStatNum = function (el) {
      if (!el.hasAttribute('data-final')) {
        el.setAttribute('data-final', el.textContent.trim());
      }
      var parsed = parseStat(el.getAttribute('data-final'));
      if (!parsed) { return; }

      var target = parseFloat(parsed.numStr);
      var duration = 900;
      var start = null;
      var token = {};
      statAnimTokens.set(el, token);

      var step = function (ts) {
        if (statAnimTokens.get(el) !== token) { return; } // отменено повторным триггером
        if (start === null) { start = ts; }
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = (target * eased).toFixed(parsed.decimals);
        el.textContent = parsed.sign + current + parsed.suffix;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = parsed.sign + parsed.numStr + parsed.suffix;
        }
      };
      requestAnimationFrame(step);
    };

    var resetStatNum = function (el) {
      var finalRaw = el.getAttribute('data-final');
      if (!finalRaw) { return; }
      var parsed = parseStat(finalRaw);
      if (!parsed) { return; }
      el.textContent = parsed.sign + (0).toFixed(parsed.decimals) + parsed.suffix;
    };

    var statsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateStatNum(entry.target);
        } else {
          statAnimTokens.delete(entry.target);
          resetStatNum(entry.target);
        }
      });
    }, { threshold: 0.4 });

    heroStatNums.forEach(function (el) { statsObserver.observe(el); });
  }
})();
