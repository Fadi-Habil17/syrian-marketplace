import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, messages } from '@syrian-marketplace/i18n';

export default async function SetupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const text = messages[locale];
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16 text-start">
      <p className="mb-4 font-semibold text-teal-800">B4F · {text.simulated}</p>
      <h1 className="text-4xl font-bold leading-snug">{text.title}</h1>
      <p className="mt-6 text-lg leading-relaxed">{text.setupDescription}</p>
      <ul className="mt-8 list-inside list-disc space-y-3 text-lg">
        <li>{text.freelance}</li>
        <li>{text.professionals}</li>
        <li>{text.homeStore}</li>
      </ul>
      <p className="mt-8 text-base">{text.setupOnly}</p>
      <Link
        className="mt-8 w-fit font-semibold text-teal-800 underline"
        href={`/${locale === 'ar' ? 'en' : 'ar'}`}
      >
        {locale === 'ar' ? 'English' : 'العربية'}
      </Link>
    </main>
  );
}
