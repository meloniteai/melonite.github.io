// Shared skyline palette supplied for the Blue Cell Bench post.
export const chartPalette = {
  chalk: '#e2dcd6', sand: '#c1a289', rose: '#997f7c', brown: '#785e4d',
  mauve: '#6f646f', plum: '#4f4452', teal: '#3c5c62', navy: '#2a2b3d',
} as const;

const familyColors: Record<string, string> = {
  'Anthropic Fable': chartPalette.brown, 'Anthropic Opus': chartPalette.rose,
  'Gemini Flash': chartPalette.sand, 'Gemini Argon': chartPalette.mauve,
  'GPT 6 Astra': chartPalette.plum, 'GPT 6.1 Sol': chartPalette.teal,
};

export const configurationColor = (family: string) => familyColors[family] ?? chartPalette.mauve;

export function benchmarkProvider(family: string | undefined): 'openai' | 'anthropic' | 'google' | 'mistral' | 'nvidia' | 'zai' | undefined {
  if (family?.startsWith('GPT')) return 'openai';
  if (family?.startsWith('Anthropic')) return 'anthropic';
  if (family?.startsWith('Gemini')) return 'google';
  if (family?.startsWith('Mistral')) return 'mistral';
  if (family?.startsWith('NVIDIA')) return 'nvidia';
  if (family?.startsWith('GLM')) return 'zai';
}
