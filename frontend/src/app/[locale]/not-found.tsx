import Link from 'next/link';
export default function NotFound() {
  return (
    <section className="page-heading">
      <h1>الصفحة غير موجودة / Page not found</h1>
      <Link className="button primary" href="/">
        الرئيسية / Home
      </Link>
    </section>
  );
}
