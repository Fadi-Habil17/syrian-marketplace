export type Locale = 'ar' | 'en';
export const isLocale = (value: string): value is Locale => value === 'ar' || value === 'en';

export const messages = {
  ar: {
    title: 'السوق السوري',
    simulated: 'مدفوعات تجريبية',
    setupDescription:
      'منصة تجمع العمل الحر والخدمات المهنية ومنتجات المتاجر المنزلية في جميع المحافظات السورية.',
    freelance: 'العمل الحر',
    professionals: 'الخدمات المهنية والحجوزات وعروض الأسعار',
    homeStore: 'المتجر المنزلي والتوصيل',
    setupOnly: 'هذه نسخة إعداد المشروع. ميزات الطلبات والدفع والإدارة قيد التخطيط ولم تُنفّذ بعد.',
  },
  en: {
    title: 'Syrian Marketplace',
    simulated: 'Simulated payments',
    setupDescription:
      'One platform for freelance work, professional services and home-produced goods across Syrian governorates.',
    freelance: 'Freelance',
    professionals: 'Professional services, bookings and quotes',
    homeStore: 'Home Store and delivery',
    setupOnly:
      'Repository setup preview. Order, payment and administration features are planned and are not implemented yet.',
  },
} as const;
