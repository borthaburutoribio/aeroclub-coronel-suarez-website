(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = window.matchMedia('(max-width: 760px)');
  const WA = 'https://wa.me/5492915353437?text=';

  /* Barra: transparente sobre la foto, sólida después */
  const bar = document.getElementById('bar');
  const hero = document.getElementById('inicio');
  const floatWa = document.querySelector('.float-wa');
  const onScroll = () => {
    const past = window.scrollY > hero.offsetHeight - 80;
    bar.dataset.state = past ? 'solid' : 'top';
    if (floatWa) floatWa.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.6);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Menú del celular */
  const toggle = document.querySelector('.bar__toggle');
  const menu = document.getElementById('menu');
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Cerrar' : 'Menú';
    if (open) bar.dataset.state = 'solid';
    else onScroll();
  });
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) { menu.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Menú'; }
  });

  /* Hero: fundido lento entre fotos (desktop) o video del Piper (celular) */
  const slides = [...document.querySelectorAll('.hero__slide')];
  let idx = 0, timer = null, paused = false;
  const nextSlide = () => {
    slides[idx].classList.remove('is-on');
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add('is-on');
  };
  const startSlides = () => { if (!phone.matches && !timer && !paused) timer = setInterval(nextSlide, 6000); };
  const stopSlides = () => { clearInterval(timer); timer = null; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stopSlides() : startSlides()));
  startSlides();

  const loadVideo = (v) => {
    if (!v) return;
    v.muted = true;
    if (!v.src && v.dataset.src) {
      v.autoplay = true;
      v.src = v.dataset.src;
      v.addEventListener('canplay', () => v.play().catch(() => {}), { once: true });
    }
    v.play().catch(() => {});
  };
  const heroVideo = document.querySelector('.hero__video');
  if (phone.matches && heroVideo) loadVideo(heroVideo);
  const pauseBtn = document.querySelector('.hero__pause');
  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.textContent = paused ? 'Reproducir' : 'Pausar';
    if (paused) { stopSlides(); heroVideo.pause(); }
    else { startSlides(); if (phone.matches) loadVideo(heroVideo); }
  });
  phone.addEventListener('change', () => { if (phone.matches) { stopSlides(); loadVideo(heroVideo); } else { heroVideo.pause(); startSlides(); } });

  /* Entradas escalonadas por sección */
  document.querySelectorAll('section, footer').forEach((sec) => {
    sec.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--d', `${Math.min(i, 5) * 80}ms`));
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      const v = en.target.querySelector('video[data-src]');
      if (v) loadVideo(v);
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  document.querySelectorAll('.reveal, .g').forEach((el) => io.observe(el));

  /* Bienvenidos: la misma foto a tres distancias */
  const sign = document.querySelector('.sign');
  if (sign) {
    sign.dataset.stage = '1';
    const so = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) sign.dataset.stage = en.target.dataset.stage; });
    }, { rootMargin: '-45% 0px -45% 0px' });
    sign.querySelectorAll('.sign__marks i').forEach((m) => so.observe(m));
  }

  /* Hoy en la pista: viento real de Open-Meteo sobre la pista 17/35 */
  const DECL = -8.5; // declinación magnética aproximada en Coronel Suárez
  const RWY = [{ name: '17', hdg: 170 + DECL }, { name: '35', hdg: 350 + DECL }];
  const svg = document.querySelector('.wind__dial');
  if (svg) {
    const ns = 'http://www.w3.org/2000/svg';
    const ticks = svg.querySelector('.dial__ticks');
    for (let d = 0; d < 360; d += 10) {
      const major = d % 90 === 0;
      const r1 = major ? 158 : 168, r2 = 180;
      const a = (d - 90) * Math.PI / 180;
      const l = document.createElementNS(ns, 'line');
      l.setAttribute('x1', 200 + r1 * Math.cos(a)); l.setAttribute('y1', 200 + r1 * Math.sin(a));
      l.setAttribute('x2', 200 + r2 * Math.cos(a)); l.setAttribute('y2', 200 + r2 * Math.sin(a));
      if (major) l.setAttribute('class', 'major');
      ticks.appendChild(l);
    }
    const dash = svg.querySelector('.rwy__dash');
    for (let y = 130; y < 280; y += 24) {
      const l = document.createElementNS(ns, 'line');
      l.setAttribute('x1', 200); l.setAttribute('x2', 200); l.setAttribute('y1', y); l.setAttribute('y2', y + 12);
      dash.appendChild(l);
    }
  }

  const $ = (id) => document.getElementById(id);
  const card = (deg) => ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'][Math.round(deg / 22.5) % 16];
  const sky = (c) => (c < 15 ? 'Despejado' : c < 45 ? 'Algunas nubes' : c < 80 ? 'Parcialmente nublado' : 'Cubierto');
  const hhmm = (iso) => iso.slice(11, 16);

  const url = 'https://api.open-meteo.com/v1/forecast?latitude=-37.4540&longitude=-61.8933'
    + '&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,weather_code'
    + '&daily=sunset&wind_speed_unit=kn&timezone=America%2FArgentina%2FBuenos_Aires&forecast_days=1';

  fetch(url).then((r) => r.json()).then((d) => {
    const c = d.current;
    const ws = Math.round(c.wind_speed_10m), wd = Math.round(c.wind_direction_10m), gust = Math.round(c.wind_gusts_10m);
    const sunset = hhmm(d.daily.sunset[0]);
    const comp = RWY.map((r) => {
      const ang = (wd - r.hdg) * Math.PI / 180;
      return { ...r, head: ws * Math.cos(ang), cross: Math.abs(ws * Math.sin(ang)) };
    }).sort((a, b) => b.head - a.head)[0];

    const arrow = svg.querySelector('.dial__wind');
    if (ws < 2) arrow.classList.add('is-calm');
    else arrow.setAttribute('transform', `rotate(${wd} 200 200)`); // sin rotar apunta al sur; rotada wd apunta hacia donde va el viento

    $('w-wind').textContent = ws < 2 ? 'Calma' : `${ws} kt del ${card(wd)} (${String(wd).padStart(3, '0')}°)${gust > ws + 4 ? `, ráfagas de ${gust}` : ''}`;
    $('w-rwy').textContent = ws < 2 ? 'Cualquiera de las dos' : `Pista ${comp.name}`;
    $('w-xw').textContent = ws < 2 ? '0 kt' : `${Math.round(comp.cross)} kt`;
    $('w-temp').textContent = `${Math.round(c.temperature_2m)} °C`;
    $('w-cloud').textContent = sky(c.cloud_cover);
    $('w-sunset').textContent = `${sunset} h`;

    const storm = c.weather_code >= 95, rain = c.weather_code >= 51 && c.weather_code < 95;
    let verdict;
    if (storm) verdict = 'Hay tormenta en la zona: hoy los aviones se quedan en el hangar.';
    else if (gust >= 25 || ws >= 20) verdict = `Está ventoso (${ws} kt). Para un bautismo conviene esperar otro día.`;
    else if (rain) verdict = 'Está lloviendo en Suárez. Buen día para el simulador.';
    else verdict = `Pinta para volar. Hoy el sol se pone a las ${sunset}: la última hora de luz es la más linda.`;
    $('w-verdict').textContent = verdict;

    const msg = `Hola! Vi en la web que hoy el sol se pone a las ${sunset}. Hay lugar para un vuelo de bautismo al atardecer?`;
    $('w-cta').href = WA + encodeURIComponent(msg);
  }).catch(() => {
    $('w-verdict').textContent = 'No pudimos traer el viento ahora. Escribinos y te contamos si se vuela hoy.';
  });

  /* Compartir */
  const share = document.getElementById('share');
  share.addEventListener('click', async () => {
    const data = { title: 'Aero Club Coronel Suárez', text: 'Escuela de vuelo y bautismos en Coronel Suárez', url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(location.href); share.textContent = 'Link copiado'; }
    } catch (e) { /* cancelado */ }
  });
})();
