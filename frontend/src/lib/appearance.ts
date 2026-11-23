export type Appearance = 'light' | 'dark' | 'system';
export const appearanceKey = 'dukkan-appearance';
// Runs before body paint. No credentials or user-specific data enter this script.
export const appearanceBoot = `(function(){try{var p=localStorage.getItem('dukkan-appearance');if(!/^(light|dark|system)$/.test(p||''))p='system';document.documentElement.dataset.theme=p;document.documentElement.style.colorScheme=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p}catch(e){}})()`;
