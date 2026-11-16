// Todo lo editable de la plataforma sin tocar el motor.
export const CONFIG = {
  academia: 'Inglés Latinoamérica',
  whatsapp: '50252017898',
  // El botón de clases aparece en inicio, resultados, sesiones, plan, práctica,
  // progreso, recursos y el pie.
  textoBotonClases: '¿Necesitas clases personalizadas? Tu primera clase diagnóstico es GRATIS',
  mensajeWhatsApp: 'Hola, vengo de la plataforma TOEFL de Inglés Latinoamérica. Quiero agendar mi primera clase diagnóstico gratis.',
  sitio: 'https://ingleslatinoamerica.com/',
};

export const enlaceWhatsApp = (extra = '') =>
  `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.mensajeWhatsApp + (extra ? ' ' + extra : ''))}`;
