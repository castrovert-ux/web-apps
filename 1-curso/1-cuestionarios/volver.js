(function () {
  // Calcula la ruta raíz subiendo un nivel desde la URL actual
  const root = location.pathname.replace(/\/[^/]+\/?$/, '/') || '/';

  const btn = document.createElement('a');
  btn.href = root;
  btn.title = 'Volver al inicio';
  btn.setAttribute('aria-label', 'Volver al inicio');
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 12L12 3l9 9"/>
      <path d="M9 21V9h6v12"/>
    </svg>
    <span>Inicio</span>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #__btn-volver {
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 10px 16px 10px 12px;
      background: rgba(15, 12, 41, 0.85);
      border: 1px solid rgba(232, 199, 107, 0.45);
      border-radius: 50px;
      color: #e8c76b;
      font-family: system-ui, sans-serif;
      font-size: 0.88rem;
      font-weight: 600;
      text-decoration: none;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
      cursor: pointer;
    }
    #__btn-volver:hover {
      background: rgba(232, 199, 107, 0.18);
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(232,199,107,0.2);
    }
    #__btn-volver:active {
      transform: translateY(0);
    }
    #__btn-volver svg {
      flex-shrink: 0;
    }
  `;

  btn.id = '__btn-volver';
  document.head.appendChild(style);

  // Espera a que el DOM esté listo
  if (document.body) {
    document.body.appendChild(btn);
  } else {
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(btn));
  }
})();