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
  if (event.key === 'Escape' && navigation.classList.contains('open')) { closeMenu(); menu.focus({ preventScroll: true }); }
});
document.addEventListener('click', event => {
  if (navigation.classList.contains('open') && !navigation.contains(event.target) && !menu.contains(event.target)) closeMenu();
});
window.matchMedia('(max-width: 760px)').addEventListener('change', closeMenu);
document.querySelector('#year').textContent = new Date().getFullYear();

const demos = {
  adelantao: { url: 'https://adelantao-al-tiempo-beta.vercel.app/adelantao-inicio.dc.html', title: "Adelanta'o al Tiempo — tienda de calzado" },
  zipotaso: { url: 'https://zipotaso.vercel.app', title: 'Zipotaso — menú digital de Zipote Food' },
  'jose-store': { url: 'https://jose-store-sepia.vercel.app/Jose%20Store.dc.html', title: 'Jose Store — catálogo digital' },
  zapateria: { url: 'demos/index.html?app=zapateria', title: 'Demo de gestión de zapatería' },
  inventario: { url: 'demos/index.html?app=inventario', title: 'Demo de gestión de inventario' }
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
      if (id === 'zapateria' || id === 'inventario') {
        frame.setAttribute('sandbox', frame.getAttribute('sandbox') + ' allow-top-navigation-by-user-activation');
      }
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

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('in'));
}
