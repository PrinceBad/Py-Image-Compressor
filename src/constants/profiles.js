// DSSB (Department of Secondary and Higher Education, or similar govt body)
// Official document image requirements for online forms.

export const DSSB_PROFILES = [
  {
    id: 'photo',
    name: 'Photo',
    shortName: 'PHOTO',
    width: 480,
    height: 672,
    minSize: 50 * 1024,   // 50 KB
    maxSize: 300 * 1024,  // 300 KB
    format: 'jpeg',
    targetSizeLabel: '50 – 300 KB',
    dimensionLabel: '480 × 672 px',
    note: '5 × 7 inches',
    accent: '#f00b51',
    bg: 'rgba(240,11,81,0.12)',
    border: 'rgba(240,11,81,0.35)',
  },
  {
    id: 'signature',
    name: 'Signature',
    shortName: 'SIGN',
    width: 140,
    height: 110,
    minSize: 10 * 1024,  // 10 KB
    maxSize: 40 * 1024,  // 40 KB
    format: 'jpeg',
    targetSizeLabel: '10 – 40 KB',
    dimensionLabel: '140 × 110 px',
    note: 'Horizontal',
    accent: '#a855f7',
    bg: 'rgba(168,85,247,0.12)',
    border: 'rgba(168,85,247,0.35)',
  },
  {
    id: 'left-thumb',
    name: 'Left Thumb',
    shortName: 'L-THUMB',
    width: 110,
    height: 140,
    minSize: 10 * 1024,  // 10 KB
    maxSize: 40 * 1024,  // 40 KB
    format: 'jpeg',
    targetSizeLabel: '10 – 40 KB',
    dimensionLabel: '110 × 140 px',
    note: 'Vertical',
    accent: '#0ea5e9',
    bg: 'rgba(14,165,233,0.12)',
    border: 'rgba(14,165,233,0.35)',
  },
  {
    id: 'right-thumb',
    name: 'Right Thumb',
    shortName: 'R-THUMB',
    width: 110,
    height: 140,
    minSize: 10 * 1024,  // 10 KB
    maxSize: 40 * 1024,  // 40 KB
    format: 'jpeg',
    targetSizeLabel: '10 – 40 KB',
    dimensionLabel: '110 × 140 px',
    note: 'Vertical',
    accent: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.35)',
  },
];

export const getProfileById = (id) => DSSB_PROFILES.find((p) => p.id === id) ?? null;
