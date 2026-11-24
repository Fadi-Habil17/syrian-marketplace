import Svg, { Path } from 'react-native-svg';
const paths = {
  menu: ['M4 6h16M4 12h16M4 18h16'],
  close: ['m6 6 12 12M6 18 18 6'],
  globe: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z'],
  moon: ['M20.7 13.2A9 9 0 0 1 10.8 3.3a9 9 0 1 0 9.9 9.9Z'],
  sun: [
    'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
  ],
  bag: ['M5 7h14l1 14H4L5 7ZM9 8V6a3 3 0 0 1 6 0v2'],
  briefcase: ['M3 7h18v14H3V7ZM8 7V3h8v4M3 12a20 20 0 0 0 18 0M12 12v4'],
  tools: [
    'm14 7 3 3m-5.5 2.5-7 7a2 2 0 0 1-3-3l7-7A6 6 0 0 1 16 2l-4 4 6 6 4-4a6 6 0 0 1-7.5 7.5Z',
  ],
  check: ['m5 12 4 4 10-10'],
  chevron: ['m7 10 5 5 5-5'],
  user: ['M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2'],
  heart: [
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  ],
};
export type IconName = keyof typeof paths;
export function Icon({ name, color, size = 20 }: { name: IconName; color: string; size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
    >
      {paths[name].map((d, i) => (
        <Path key={i} d={d} />
      ))}
    </Svg>
  );
}
