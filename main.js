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
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalLabel = submitBtn.textContent;
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
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        });
    });
  }
})();
