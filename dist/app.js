const menu = document.querySelector('.menu');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Abrir menú');
}
menu.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) { closeMenu(); menu.focus(); }
});
document.querySelector('#year').textContent = new Date().getFullYear();

const demos = {
  zipotaso: { url: 'https://zipotaso.vercel.app', title: 'Zipotaso — menú digital de Zipote Food' },
  'jose-store': { url: 'https://jose-store-sepia.vercel.app/Jose%20Store.dc.html', title: 'Jose Store — catálogo digital' }
};
function closeDemo(id, restoreFocus = false) {
  document.querySelector(`#demo-${id}`).hidden = true;
  const toggle = document.querySelector(`[data-demo="${id}"]`);
  toggle.setAttribute('aria-expanded', 'false');
  if (restoreFocus) toggle.focus();
}
document.querySelectorAll('.demo-toggle').forEach(button => {
  button.addEventListener('click', () => {
    const id = button.dataset.demo;
    const panel = document.querySelector(`#demo-${id}`);
    if (!panel.hidden) { closeDemo(id); return; }
    Object.keys(demos).forEach(other => closeDemo(other));
    if (!panel.querySelector('iframe')) {
      const frame = document.createElement('iframe');
      frame.src = demos[id].url;
      frame.title = demos[id].title;
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      panel.querySelector('.demo-frame').append(frame);
    }
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    panel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    panel.querySelector('.demo-close').focus({ preventScroll: true });
  });
});
document.querySelectorAll('.demo-close').forEach(button => {
  button.addEventListener('click', () => closeDemo(button.dataset.close, true));
});
