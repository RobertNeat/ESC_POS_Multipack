export const MAX_FONT_UPLOAD_BYTES = 5 * 1024 * 1024;

export const BUILT_IN_GEIST_MONO_ID = 'built-in-geist-mono';

export const BUILT_IN_FONTS = [
  {
    id: BUILT_IN_GEIST_MONO_ID,
    displayName: 'Geist Mono',
    regularFile: 'GeistMono-Regular.ttf',
    boldFile: 'GeistMono-Bold.ttf',
  },
] as const;
