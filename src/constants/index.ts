export const COLORS = {
  primary: '#7B6FFF',
  primaryDark: '#5A4FD6',
  primaryLight: '#A99DFF',
  secondary: '#FF6B8A',
  success: '#00D4AA',
  successDark: '#00A882',
  warning: '#FFB830',
  danger: '#FF4F6B',
  dangerDark: '#D63652',
  background: '#08081A',
  surface: '#11112A',
  surfaceLight: '#1A1A38',
  text: '#F2F2FF',
  textSecondary: '#9898BC',
  textMuted: '#55557A',
  border: '#222244',
  cardBg: '#14142C',
  gold: '#FFD700',
  teal: '#00D4AA',
  pink: '#FF6B8A',
};

export const SHADOWS = {
  primary: { shadowColor: '#7B6FFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  danger: { shadowColor: '#FF4F6B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  success: { shadowColor: '#00D4AA', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
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
