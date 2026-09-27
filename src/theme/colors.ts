import { Appearance } from 'react-native';

const light = {
  paper: '#F3F4F1',
  paperRaised: '#FFFFFF',
  ink: '#152331',
  inkSoft: '#5B6B78',
  rule: '#D8DAD2',
  action: '#1F4D3D',
  actionPress: '#153A2E',
  stamp: '#B5502E',
  success: '#2C6B4F',
  warn: '#946B1D',
  error: '#9C3B32',
  focusRing: '#1F4D3D',
};

const dark = {
  paper: '#14181A',
  paperRaised: '#1B2124',
  ink: '#EAE7DD',
  inkSoft: '#9BA6A9',
  rule: '#2B3235',
  action: '#5FA687',
  actionPress: '#4A8A6E',
  stamp: '#D98A5E',
  success: '#5FA687',
  warn: '#C49A3C',
  error: '#D46B61',
  focusRing: '#5FA687',
};

const colorScheme = Appearance.getColorScheme();
export const colors = colorScheme === 'dark' ? dark : light;
