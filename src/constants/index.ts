export const COLORS = {
  primary: '#6C63FF',
  primaryDark: '#4A42D6',
  secondary: '#FF6584',
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  text: '#FFFFFF',
  textSecondary: '#A0A0C0',
  textMuted: '#606080',
  border: '#2A2A45',
  cardBg: '#1E1E35',
};

export const SPAM_PATTERNS = [
  /premio|ganaste|felicitaciones|has\s*ganado|ha\s*sido\s*seleccionado/i,
  /urgente|llamar?\s*ahora|act[uú]a\s*ya|oferta\s*limitada|tiempo\s*limitado/i,
  /cr[eé]dito\s*f[aá]cil|pr[eé]stamo\s*r[aá]pido|dinero\s*f[aá]cil|sin\s*aval/i,
  /bitcoin|criptomoneda|inversi[oó]n\s*garantizada|rendimiento\s*seguro/i,
  /cuenta\s*ha\s*sido\s*suspendida|verifique\s*su\s*cuenta|acceso\s*no\s*autorizado/i,
  /haga\s*clic\s*aqu[ií]|pulse\s*aqu[ií]|enlace\s*gratuito|pincha\s*aqu[ií]/i,
  /perder\s*peso|adelgazar\s*r[aá]pido|pastillas\s*milagrosas|dieta\s*m[aá]gica/i,
  /trabajar\s*desde\s*casa|ingresos\s*extra|ganar\s*dinero\s*f[aá]cil/i,
  /recoja\s*su\s*premio|reclame\s*su\s*regalo|reclamar?\s*ahora/i,
  /transferencia\s*bloqueada|datos\s*bancarios|confirme\s*su\s*contrase[nñ]a/i,
  /nigerian?\s*prince|wire\s*transfer|unclaimed\s*funds/i,
  /llame\s*al\s*900|llame\s*al\s*901|llame\s*al\s*902/i,
];

export const KNOWN_SPAM_PREFIXES = [
  '+34900', '+34901', '+34902', '+34800', '+34803', '+34806', '+34807',
  '+1900', '+44870', '+44871', '+44872', '+44873',
];

export const STORAGE_KEYS = {
  BLOCKED_ITEMS: 'blocked_items',
  RULES: 'spam_rules',
  SETTINGS: 'app_settings',
  STATS: 'spam_stats',
};

export const DEFAULT_SETTINGS = {
  callBlockingEnabled: true,
  smsFilteringEnabled: true,
  emailFilteringEnabled: true,
  aiAnalysisEnabled: true,
  autoBlockHighConfidence: true,
  confidenceThreshold: 0.75,
  notificationsEnabled: true,
  allowUnknownNumbers: false,
  blockInternational: false,
};
