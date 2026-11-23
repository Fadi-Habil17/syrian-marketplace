'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { choose, type Locale } from '../lib/locale';

const journeys = [
  {
    id: 'goods',
    ar: 'اشتري من متجر منزلي',
    en: 'Shop something local',
    route: 'home-store',
    icon: '⌂',
    steps: [
      [
        'لقطة بتشبه ذوقك',
        'Find your kind of thing',
        'تصفّح المنتجات واختر من متجر واحد.',
        'Browse goods and choose from one home store.',
      ],
      [
        'التفاصيل واضحة',
        'Know what to expect',
        'راجع العنوان، طريقة التوصيل والسعر النهائي.',
        'Review the address, delivery method and final total.',
      ],
      [
        'دفعة واحدة بالمحاكاة',
        'One simulated payment',
        'تُحجز قيمة المنتجات والتوصيل عند تأكيد الشراء.',
        'Items and delivery are held together at checkout.',
      ],
      [
        'من إيدهم لإيدك',
        'From their hands to yours',
        'تابع التحضير والتوصيل ثم أكّد الاستلام، أو افتح نزاعاً خلال المهلة.',
        'Track preparation and delivery. Confirm receipt, or open a dispute within the review window.',
      ],
    ],
  },
  {
    id: 'freelance',
    ar: 'وظّف مستقل',
    en: 'Bring an idea to life',
    route: 'freelance',
    icon: '✳',
    steps: [
      [
        'الفكرة بتبلّش معك',
        'Start with your idea',
        'اختر خدمة رقمية وشارك المستقل شو بدك.',
        'Choose a digital service and describe what you need.',
      ],
      [
        'اتفقوا على الشغل',
        'Agree on the work',
        'ثبّتوا النطاق والسعر وموعد التسليم قبل الدفع.',
        'Agree on scope, price and due date before paying.',
      ],
      [
        'ثلث للبداية',
        'A third to get started',
        'يُحجز الثلث قبل بدء العمل، والباقي عند الجاهزية قبل التسليم النهائي.',
        'One third is held before work; the remainder when ready, before final delivery.',
      ],
      [
        'كل خطوة بمكان واحد',
        'Keep it all together',
        'تابع الشغل والمحادثة، وراجع التسليم قبل تأكيد الإكمال.',
        'Follow progress and chat, then review delivery before confirming completion.',
      ],
    ],
  },
  {
    id: 'professional',
    ar: 'احجز مهني',
    en: 'Find a local professional',
    route: 'professionals',
    icon: '↗',
    steps: [
      [
        'المهني المناسب',
        'The right local skill',
        'تصفّح الخدمات المتاحة بمنطقتك.',
        'Browse the services available in your area.',
      ],
      [
        'موعد باتفاق الطرفين',
        'A time that works',
        'أرسل طلب حجز؛ المهني يؤكد الموعد قبل دفع العربون.',
        'Request a booking. The professional confirms the schedule before your deposit.',
      ],
      [
        'دفع على مرحلتين',
        'Two clear payments',
        'ثلث بالبداية والباقي قبل التسليم. الأسعار والحسابات من المنصة.',
        'A third at the start, the remainder before handover. The platform calculates the amounts.',
      ],
      [
        'تابع لحد التسليم',
        'Follow through to handover',
        'تواصل ضمن الطلب وراجع النتيجة، أو اطلب معالجة المشكلة.',
        'Keep the conversation with the order, review the result or raise an issue.',
      ],
    ],
  },
] as const;
export function HowItWorks({ locale }: { locale: Locale }) {
  const [selected, setSelected] = useState(0),
    [step, setStep] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const journey = journeys[selected]!;
  return (
    <section className="how-section" id="how-it-works" aria-labelledby="how-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {choose(locale, 'من أول خطوة لآخر تسليم', 'FROM FIRST HELLO TO FINAL HANDOVER')}
          </span>
          <h2 id="how-title">
            {choose(locale, 'كيف بتمشي الحكاية؟', 'Good things start with a hello.')}
          </h2>
        </div>
        <p>
          {choose(
            locale,
            'اختر رحلتك. كل خطوة واضحة، وكل التفاصيل ضمن طلبك.',
            'Pick your journey. Clear steps, with the details kept in one place.',
          )}
        </p>
      </div>
      <div
        className="journey-tabs"
        role="tablist"
        aria-label={choose(locale, 'رحلات السوق', 'Marketplace journeys')}
      >
        {journeys.map((j, index) => (
          <button
            key={j.id}
            id={'journey-' + j.id}
            ref={(el) => {
              tabs.current[index] = el;
            }}
            role="tab"
            type="button"
            tabIndex={index === selected ? 0 : -1}
            aria-selected={selected === index}
            aria-controls="journey-panel"
            onClick={() => {
              setSelected(index);
              setStep(0);
            }}
            onKeyDown={(event) => {
              const delta =
                event.key === 'ArrowRight'
                  ? locale === 'ar'
                    ? -1
                    : 1
                  : event.key === 'ArrowLeft'
                    ? locale === 'ar'
                      ? 1
                      : -1
                    : 0;
              const next =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? journeys.length - 1
                    : delta
                      ? (index + delta + journeys.length) % journeys.length
                      : null;
              if (next !== null) {
                event.preventDefault();
                setSelected(next);
                setStep(0);
                tabs.current[next]?.focus();
              }
            }}
          >
            <span aria-hidden="true">{j.icon}</span>
            {choose(locale, j.ar, j.en)}
          </button>
        ))}
      </div>
      <div
        id="journey-panel"
        role="tabpanel"
        aria-labelledby={'journey-' + journey.id}
        className="journey-panel"
        tabIndex={0}
      >
        <div className="journey-steps">
          {journey.steps.map((s, index) => (
            <button
              key={index}
              type="button"
              aria-pressed={step === index}
              onClick={() => setStep(index)}
            >
              <span className="step-number">
                {new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(index + 1)}
              </span>
              <span>{choose(locale, s[0], s[1])}</span>
              <span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
        <div className="journey-preview" key={journey.id + '-' + step}>
          <span className="journey-symbol" aria-hidden="true">
            {journey.icon}
          </span>
          <span className="eyebrow">
            {choose(locale, 'خطوة', 'STEP')} {new Intl.NumberFormat(locale).format(step + 1)} /{' '}
            {new Intl.NumberFormat(locale).format(4)}
          </span>
          <h3>{choose(locale, journey.steps[step]![0], journey.steps[step]![1])}</h3>
          <p aria-live="polite">
            {choose(locale, journey.steps[step]![2], journey.steps[step]![3])}
          </p>
          <Link className="button primary" href={'/' + locale + '/' + journey.route}>
            {choose(locale, 'خلّينا نبلّش', 'Let’s get started')} <span aria-hidden="true">↗</span>
          </Link>
          <small>
            {choose(locale, 'المدفوعات تجريبية بالمحاكاة.', 'All payments are simulated.')}
          </small>
        </div>
      </div>
    </section>
  );
}
export function FilmCard({
  locale,
  title,
  description,
  source,
  poster,
  tour = false,
}: {
  locale: Locale;
  title: string;
  description: string;
  source?: string;
  poster: string;
  tour?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [failed, setFailed] = useState(false);
  const playable =
    !!source &&
    ((source.startsWith('/') && !source.startsWith('//')) || source.startsWith('https://'));
  return (
    <article className={'film-card ' + (tour ? 'walkthrough-card' : 'marketplace-film')}>
      <div className="film-poster">
        {open && playable && !failed ? (
          <video
            controls
            autoPlay
            playsInline
            preload="none"
            poster={poster}
            aria-label={title}
            onError={() => setFailed(true)}
          >
            <source src={source} />
            <track
              kind="captions"
              src={'/media/' + (tour ? 'walkthrough' : 'marketplace-film') + '-' + locale + '.vtt'}
              srcLang={locale}
              label={locale === 'ar' ? 'العربية' : 'English'}
              default
            />
            {choose(locale, 'متصفحك لا يدعم الفيديو.', 'Your browser does not support video.')}
          </video>
        ) : (
          <>
            <Image src={poster} alt="" loading="lazy" width={960} height={640} unoptimized />
            {playable && !failed && (
              <button
                type="button"
                className="watch-button"
                onClick={() => setOpen(true)}
                aria-label={choose(locale, 'شاهد: ', 'Watch: ') + title}
              >
                <span aria-hidden="true">▶</span>
                {tour
                  ? choose(locale, 'شغّل الجولة', 'Play walkthrough')
                  : choose(locale, 'شاهد الفيديو', 'Watch the film')}
              </button>
            )}
          </>
        )}
      </div>
      <div className="film-copy">
        <span className="eyebrow">
          {tour
            ? choose(locale, 'جولة داخل السوق', 'A LOOK INSIDE')
            : choose(locale, 'من حاراتنا', 'FROM OUR NEIGHBOURHOODS')}
        </span>
        <h3>{title}</h3>
        <p>{description}</p>
        {failed && (
          <p role="status">
            {choose(
              locale,
              'تعذّر تشغيل الفيديو. السوق ما زال بين إيديك.',
              'The video could not play. You can still explore the marketplace.',
            )}
          </p>
        )}
        {(!playable || failed) && (
          <Link className="text-link" href={'/' + locale + '/home-store'}>
            {choose(locale, 'اكتشف السوق بالصور', 'Explore the marketplace')} ↗
          </Link>
        )}
      </div>
    </article>
  );
}
