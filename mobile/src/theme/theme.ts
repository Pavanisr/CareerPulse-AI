// Palette: chalk-blue paper, deep ink, harbour teal as the single action colour, amber for "needs attention".
export const colors = {
  bg: '#EEF2F7',
  surface: '#FFFFFF',
  ink: '#10202E',
  muted: '#5F7183',
  line: '#D5DEE8',
  primary: '#0E7C86',
  primarySoft: '#DDF1F2',
  amber: '#E59A2B',
  amberSoft: '#FCEFD6',
  good: '#2E9E68',
  danger: '#C9453E',
  dangerSoft: '#F9E1DF',
};
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 6, md: 12, lg: 20 };
export const scoreColor = (s: number) => (s >= 75 ? colors.good : s >= 50 ? colors.amber : colors.danger);
