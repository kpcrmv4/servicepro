import Link from 'next/link';
import Image from 'next/image';
import type { Section } from '@/lib/landing/types';

interface Props {
  section: Section;
  primaryColor: string;
}

export function SectionRenderer({ section, primaryColor }: Props) {
  switch (section.type) {
    case 'hero':
      return (
        <section
          className="relative flex min-h-[60vh] items-center justify-center bg-gradient-to-br px-6 py-20 text-white"
          style={{
            backgroundColor: primaryColor,
            backgroundImage: section.data.image_url
              ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${section.data.image_url})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="max-w-3xl text-center">
            <h1 className="text-4xl font-bold sm:text-6xl">{section.data.headline}</h1>
            {section.data.subheadline && (
              <p className="mt-4 text-lg opacity-90 sm:text-xl">{section.data.subheadline}</p>
            )}
            {section.data.cta_label && section.data.cta_link && (
              <Link
                href={section.data.cta_link}
                className="mt-8 inline-block rounded-full bg-white px-8 py-3 font-semibold text-foreground shadow-lg hover:scale-105 transition-transform"
                style={{ color: primaryColor }}
              >
                {section.data.cta_label}
              </Link>
            )}
          </div>
        </section>
      );

    case 'about':
      return (
        <section className="px-6 py-20">
          <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold">{section.data.title}</h2>
              <p className="mt-4 whitespace-pre-wrap leading-relaxed text-muted-foreground">
                {section.data.body}
              </p>
            </div>
            {section.data.image_url && (
              <Image
                src={section.data.image_url}
                alt={section.data.title}
                width={600}
                height={400}
                unoptimized
                className="rounded-2xl object-cover"
              />
            )}
          </div>
        </section>
      );

    case 'services':
      return (
        <section className="bg-muted/30 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-bold">{section.data.title}</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {section.data.items.map((item, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  {item.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  )}
                  {item.price_label && (
                    <p
                      className="mt-3 text-base font-bold"
                      style={{ color: primaryColor }}
                    >
                      {item.price_label}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'gallery':
      return (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-bold">{section.data.title}</h2>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {section.data.images.map((img, i) => (
                <div key={i} className="overflow-hidden rounded-lg">
                  <Image
                    src={img.url}
                    alt={img.caption || ''}
                    width={400}
                    height={400}
                    unoptimized
                    className="aspect-square object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'reviews':
      return (
        <section className="bg-muted/30 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-3xl font-bold">{section.data.title}</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {section.data.items.map((r, i) => (
                <div key={i} className="rounded-2xl bg-card p-6 shadow-sm">
                  {r.rating != null && (
                    <div className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  )}
                  <p className="mt-3 italic text-foreground">&ldquo;{r.text}&rdquo;</p>
                  <p className="mt-2 text-sm font-semibold">— {r.author}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'contact':
      return (
        <section id="contact" className="px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-bold">ติดต่อเรา</h2>
            <div className="mt-8 space-y-3 text-center text-base">
              {section.data.phone && (
                <p>
                  <span className="text-muted-foreground">โทร: </span>
                  <a className="font-semibold" href={`tel:${section.data.phone}`} style={{ color: primaryColor }}>
                    {section.data.phone}
                  </a>
                </p>
              )}
              {section.data.email && (
                <p>
                  <span className="text-muted-foreground">อีเมล: </span>
                  <a className="font-semibold" href={`mailto:${section.data.email}`} style={{ color: primaryColor }}>
                    {section.data.email}
                  </a>
                </p>
              )}
              {section.data.address && (
                <p>
                  <span className="text-muted-foreground">ที่อยู่: </span>
                  <span>{section.data.address}</span>
                </p>
              )}
              {section.data.hours && (
                <p>
                  <span className="text-muted-foreground">เวลาเปิด: </span>
                  <span>{section.data.hours}</span>
                </p>
              )}
            </div>
            {section.data.map_url && (
              <div className="mt-8 overflow-hidden rounded-2xl">
                <iframe
                  src={section.data.map_url}
                  className="h-80 w-full"
                  title="Map"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </section>
      );

    case 'faq':
      return (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-bold">คำถามที่พบบ่อย</h2>
            <div className="mt-8 space-y-3">
              {section.data.items.map((q, i) => (
                <details key={i} className="rounded-xl border border-border bg-card p-4">
                  <summary className="cursor-pointer font-semibold">{q.question}</summary>
                  <p className="mt-2 text-sm text-muted-foreground">{q.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      );

    case 'cta':
      return (
        <section
          className="px-6 py-20 text-center text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold sm:text-4xl">{section.data.headline}</h2>
            <Link
              href={section.data.button_link}
              className="mt-6 inline-block rounded-full bg-white px-8 py-3 font-semibold shadow-lg hover:scale-105 transition-transform"
              style={{ color: primaryColor }}
            >
              {section.data.button_label}
            </Link>
          </div>
        </section>
      );
  }
}
