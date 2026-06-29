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
  /premio|ganaste|felicitaciones|has\s*ganado/i,
  /urgente|llamar\s*ahora|actúa\s*ya|oferta\s*limitada/i,
  /crédito\s*fácil|préstamo\s*rápido|dinero\s*fácil/i,
  /bitcoin|criptomoneda|inversión\s*garantizada/i,
  /su\s*cuenta\s*ha\s*sido\s*suspendida|verifique\s*su\s*cuenta/i,
  /haga\s*clic\s*aquí|pulse\s*aquí|enlace\s*gratuito/i,
  /perder\s*peso|adelgazar\s*rápido|pastillas\s*milagrosas/i,
  /trabajar\s*desde\s*casa|ingresos\s*extra|ganar\s*dinero/i,
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
