export type Appearance = 'light' | 'dark';
export const appearanceKey = 'dukkan-appearance';
// Runs before body paint. No credentials or user-specific data enter this script.
export const appearanceBoot = `(function(){var p='light';try{var s=localStorage.getItem('dukkan-appearance');if(s==='light'||s==='dark')p=s;else if(matchMedia('(prefers-color-scheme: dark)').matches)p='dark'}catch(e){}document.documentElement.dataset.theme=p;document.documentElement.style.colorScheme=p})()`;
