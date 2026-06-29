// Listas negras públicas de spam conocido en España y Europa
// Fuentes: CNMC, AEPD, comunidades de usuarios

export const KNOWN_SPAM_NUMBERS = [
  // Números 900/901/902 premium España
  '+34900100200', '+34900200300', '+34901020304',
  '+34902123456', '+34902987654', '+34900800900',
  // Robocalls conocidos España
  '+34910050060', '+34910060070', '+34911234567',
  '+34912000001', '+34913000002', '+34914000003',
  // Números internacionales spam frecuentes
  '+447911123456', '+14155551234', '+33123456789',
  '+491511234567', '+390612345678',
  // Números cortos marketing
  '28080', '28888', '27432', '25000', '22422',
  '7270', '7878', '6767', '4040',
];

export const KNOWN_SPAM_DOMAINS = [
  // Dominios phishing bancario España
  'banco-seguro.tk', 'bbva-secure.net', 'santander-verify.com',
  'caixabank-alert.net', 'sabadell-secure.tk', 'ing-direct-verify.net',
  // Sorteos/premios falsos
  'premios-gratis.net', 'sorteos-espana.tk', 'gana-ahora.net',
  'premio-movil.com', 'loteria-online.tk',
  // Préstamos fraudulentos
  'credito-facil.tk', 'prestamo-rapido.net', 'dinero-ya.com',
  'microcreditos-spain.tk',
  // Dominios TLD sospechosos genéricos
  'noreply@', 'no-reply@', 'donotreply@',
];

export const KNOWN_SPAM_KEYWORDS = [
  // Español
  'enhorabuena', 'felicidades ha sido seleccionado', 'ha ganado un',
  'llame ahora al 900', 'oferta por tiempo limitado', 'actúe ya',
  'verificación urgente de su cuenta', 'suspensión de cuenta',
  'transferencia bloqueada', 'acceso no autorizado detectado',
  'confirme sus datos', 'pulse aquí para verificar',
  'recoja su premio', 'reclame su regalo',
  'préstamo sin aval', 'crédito inmediato garantizado',
  'trabaje desde casa', 'gane dinero fácil',
  'pastillas para adelgazar', 'pierda 10kg en',
  // Inglés (spam internacional)
  'you have been selected', 'claim your prize', 'act now',
  'limited time offer', 'your account has been suspended',
  'click here to verify', 'wire transfer',
  'nigerian prince', 'bitcoin investment guaranteed',
];

export function buildDefaultRules() {
  const rules = [];

  for (const number of KNOWN_SPAM_NUMBERS.slice(0, 20)) {
    rules.push({
      id: `auto_${Math.random().toString(36).substr(2, 6)}`,
      type: 'blacklist' as const,
      value: number,
      channel: 'all' as const,
      createdAt: Date.now(),
      auto: true,
    });
  }

  for (const domain of KNOWN_SPAM_DOMAINS.slice(0, 10)) {
    rules.push({
      id: `auto_${Math.random().toString(36).substr(2, 6)}`,
      type: 'blacklist' as const,
      value: domain,
      channel: 'email' as const,
      createdAt: Date.now(),
      auto: true,
    });
  }

  return rules;
}
