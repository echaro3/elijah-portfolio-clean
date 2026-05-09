import React, { useMemo, useState } from 'react'

const initialProfile = {
  businessName: 'Elijah Charo Studio',
  industry: 'Local service brand',
  services: 'Website design\nBrand strategy\nLead generation pages',
  phone: '(555) 014-8821',
  address: 'San Antonio, TX',
  colors: {
    primary: '#136f63',
    accent: '#f2b84b',
    background: '#f8faf7',
    text: '#13201d',
  },
  socials: {
    website: 'https://elijahcharo.com',
    facebook: '',
    instagram: 'https://instagram.com/elijahcharo',
    linkedin: 'https://linkedin.com/in/elijahcharo',
  },
}

const colorFields = [
  ['primary', 'Primary'],
  ['accent', 'Accent'],
  ['background', 'Background'],
  ['text', 'Text'],
]

const socialFields = [
  ['website', 'Website', 'https://elijahcharo.com'],
  ['facebook', 'Facebook', 'https://facebook.com/yourpage'],
  ['instagram', 'Instagram', 'https://instagram.com/yourhandle'],
  ['linkedin', 'LinkedIn', 'https://linkedin.com/company/yourbrand'],
]

function splitServices(value) {
  return value
    .split(/\n|,/)
    .map((service) => service.trim())
    .filter(Boolean)
}

function hostname(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return value.replace(/^https?:\/\//, '') || 'elijahcharo.com'
  }
}

function sentenceEnd(value) {
  const trimmed = value.trim() || 'your business'
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

function Icon({ name, className = 'h-4 w-4' }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    viewBox: '0 0 24 24',
    className,
    'aria-hidden': true,
  }

  if (name === 'phone') {
    return <svg {...common}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L8 9.72a16 16 0 0 0 6.28 6.28l1.29-1.28a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92Z" /></svg>
  }

  if (name === 'map') {
    return <svg {...common}><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
  }

  if (name === 'arrow') {
    return <svg {...common}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
  }

  if (name === 'globe') {
    return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 0 20" /><path d="M12 2a15.3 15.3 0 0 0 0 20" /></svg>
  }

  return <svg {...common}><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15Z" /></svg>
}

function TextField({ label, value, placeholder, type = 'text', onChange }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
      />
    </label>
  )
}

function TextArea({ label, value, placeholder, onChange }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
        className="resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
      />
    </label>
  )
}

function FieldGroup({ title, icon, children }) {
  return (
    <fieldset className="rounded-lg border border-slate-200 bg-white/80 p-4 shadow-sm">
      <legend className="flex items-center gap-2 px-2 text-sm font-black text-slate-900">
        <Icon name={icon} />
        {title}
      </legend>
      <div className="mt-3 grid gap-4">{children}</div>
    </fieldset>
  )
}

function GeneratorForm({ profile, setProfile }) {
  const updateField = (field, value) => setProfile((current) => ({ ...current, [field]: value }))
  const updateColors = (field, value) => setProfile((current) => ({ ...current, colors: { ...current.colors, [field]: value } }))
  const updateSocials = (field, value) => setProfile((current) => ({ ...current, socials: { ...current.socials, [field]: value } }))

  return (
    <section className="lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto border-b border-slate-200 bg-white/85 p-5 backdrop-blur-xl lg:border-b-0 lg:border-r lg:p-7">
      <header className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-700 text-white shadow-lg shadow-emerald-900/20">
          <Icon name="sparkles" className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-950">Landing Page Generator</h1>
          <p className="text-sm leading-6 text-slate-500">Local-state tool route for elijahcharo.com.</p>
        </div>
      </header>

      <form className="grid gap-5">
        <FieldGroup title="Business Details" icon="sparkles">
          <TextField label="Business name" value={profile.businessName} placeholder="Your business name" onChange={(value) => updateField('businessName', value)} />
          <TextField label="Industry" value={profile.industry} placeholder="Home services, restaurant, design studio..." onChange={(value) => updateField('industry', value)} />
          <TextArea label="Services" value={profile.services} placeholder="One service per line" onChange={(value) => updateField('services', value)} />
        </FieldGroup>

        <FieldGroup title="Contact" icon="map">
          <TextField label="Phone number" value={profile.phone} placeholder="(555) 000-0000" type="tel" onChange={(value) => updateField('phone', value)} />
          <TextField label="Address" value={profile.address} placeholder="City, state or full address" onChange={(value) => updateField('address', value)} />
        </FieldGroup>

        <FieldGroup title="Brand Colors" icon="sparkles">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {colorFields.map(([key, label]) => (
              <label key={key} className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</span>
                <div className="grid grid-cols-[42px_minmax(0,1fr)] items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
                  <input aria-label={`${label} color`} type="color" value={profile.colors[key]} onChange={(event) => updateColors(key, event.target.value)} className="h-8 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0" />
                  <code className="truncate text-xs font-semibold uppercase text-slate-500">{profile.colors[key]}</code>
                </div>
              </label>
            ))}
          </div>
        </FieldGroup>

        <FieldGroup title="Social Links" icon="globe">
          {socialFields.map(([key, label, placeholder]) => (
            <TextField key={key} label={label} value={profile.socials[key]} placeholder={placeholder} type="url" onChange={(value) => updateSocials(key, value)} />
          ))}
        </FieldGroup>
      </form>
    </section>
  )
}

function PreviewHeader({ profile }) {
  return (
    <header className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-10">
      <a href="/" className="flex min-w-0 items-center gap-3 font-black" aria-label="Back to portfolio home">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm text-white" style={{ backgroundColor: profile.colors.primary }}>
          {(profile.businessName || 'E').slice(0, 1)}
        </span>
        <span className="truncate">{profile.businessName || 'Your Business'}</span>
      </a>
      <nav className="flex gap-5 text-sm font-bold opacity-80" aria-label="Generated preview navigation">
        <a href="#services">Services</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  )
}

function HeroSection({ profile, services }) {
  const leadService = services[0] || 'high-converting landing pages'

  return (
    <section className="grid items-center gap-8 px-5 pb-14 pt-8 md:grid-cols-[1.1fr_0.9fr] md:px-10 md:pb-20 md:pt-12">
      <div className="grid gap-5">
        <h2 className="max-w-3xl text-4xl font-black leading-none tracking-normal sm:text-5xl lg:text-6xl">
          A sharper landing page for {sentenceEnd(profile.businessName)}
        </h2>
        <p className="max-w-2xl text-base leading-8 opacity-75 sm:text-lg">
          Lead with {leadService.toLowerCase()}, explain the value fast, and give customers the contact details they need to act.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href={`tel:${profile.phone}`} className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-black text-white shadow-xl" style={{ backgroundColor: profile.colors.primary }}>
            <Icon name="phone" />
            Call now
          </a>
          <a href="#services" className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white/70 px-4 text-sm font-black">
            View services
            <Icon name="arrow" />
          </a>
        </div>
      </div>

      <aside className="relative min-h-[360px] overflow-hidden rounded-lg p-7 text-white shadow-2xl" style={{ background: `linear-gradient(145deg, ${profile.colors.primary}, #0f2f2b)` }} aria-label="Generated brand card">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/30" />
        <div className="absolute -left-20 bottom-10 h-48 w-48 rounded-full border border-white/25" />
        <div className="absolute right-14 bottom-16 h-20 w-20 rounded-full opacity-80" style={{ backgroundColor: profile.colors.accent }} />
        <div className="relative grid h-full content-end gap-4">
          <p className="text-xs font-black uppercase tracking-wide text-white/70">{profile.industry || 'Industry'}</p>
          <h3 className="text-4xl font-black leading-none sm:text-5xl">{profile.businessName || 'Your Business'}</h3>
          <div className="flex w-fit items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white/90"><Icon name="phone" />{profile.phone || '(555) 000-0000'}</div>
          <div className="flex w-fit items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white/90"><Icon name="map" />{profile.address || 'Your service area'}</div>
        </div>
      </aside>
    </section>
  )
}

function ServicesSection({ services, colors }) {
  return (
    <section id="services" className="px-5 py-16 md:px-10">
      <div className="mb-8 max-w-3xl">
        <h2 className="text-3xl font-black leading-tight sm:text-4xl">Services built around your customer's next step</h2>
        <p className="mt-3 text-base leading-7 opacity-70">Reusable cards update from the services field, keeping the preview modular.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {services.map((service, index) => (
          <article key={`${service}-${index}`} className="grid min-h-[210px] content-between rounded-lg border border-slate-200 bg-white/70 p-5 shadow-sm">
            <span className="grid h-10 w-10 place-items-center rounded-lg text-xs font-black" style={{ backgroundColor: `${index % 2 === 0 ? colors.primary : colors.accent}22`, color: index % 2 === 0 ? colors.primary : '#9a6a00' }}>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h3 className="text-xl font-black leading-tight">{service}</h3>
              <p className="mt-3 text-sm leading-6 opacity-70">Clear positioning, concise proof, and a direct path from interest to contact for this offer.</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function TrustSection({ profile }) {
  const points = [
    ['Fast', 'Clear first impression'],
    ['Local', profile.address || 'Service area ready'],
    ['Direct', profile.phone || 'Phone CTA ready'],
  ]

  return (
    <section className="grid gap-8 px-5 py-16 md:grid-cols-[0.9fr_1.1fr] md:px-10" style={{ backgroundColor: `${profile.colors.primary}12` }}>
      <div>
        <h2 className="text-3xl font-black leading-tight sm:text-4xl">Simple, trustworthy, and easy to reach</h2>
        <p className="mt-4 text-base leading-7 opacity-70">This section can become testimonials, portfolio highlights, certifications, or service guarantees when real content is ready.</p>
      </div>
      <div className="grid gap-4">
        {points.map(([title, text]) => (
          <div key={title} className="grid gap-2 border-b border-slate-300/60 pb-4 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
            <strong className="text-2xl font-black">{title}</strong>
            <span className="opacity-70">{text}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function ContactSection({ profile }) {
  return (
    <section id="contact" className="grid gap-7 px-5 py-16 text-white md:grid-cols-[1fr_auto] md:items-center md:px-10" style={{ backgroundColor: profile.colors.text }}>
      <div className="max-w-3xl">
        <h2 className="text-3xl font-black leading-tight sm:text-4xl">Ready to talk?</h2>
        <p className="mt-4 text-base leading-7 text-white/70">Reach {profile.businessName || 'the team'} today and turn this page into a lead capture flow when you are ready for backend wiring.</p>
      </div>
      <div className="grid gap-3">
        <a href={`tel:${profile.phone}`} className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-black" style={{ color: profile.colors.text }}><Icon name="phone" />{profile.phone || 'Call'}</a>
        <a href={`https://maps.google.com/?q=${encodeURIComponent(profile.address)}`} className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-black" style={{ color: profile.colors.text }}><Icon name="map" />{profile.address || 'Map'}</a>
      </div>
    </section>
  )
}

function PreviewFooter({ profile }) {
  const visibleSocials = socialFields.filter(([key]) => profile.socials[key])

  return (
    <footer className="flex flex-col gap-4 px-5 py-7 text-sm font-bold opacity-80 sm:flex-row sm:items-center sm:justify-between md:px-10">
      <span>{profile.businessName || 'Your Business'}</span>
      <div className="flex flex-wrap gap-2">
        {visibleSocials.map(([key, label]) => (
          <a key={key} href={profile.socials[key]} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300" aria-label={label}>
            <Icon name={key === 'website' ? 'globe' : 'arrow'} />
          </a>
        ))}
      </div>
    </footer>
  )
}

function LandingPreview({ profile, services }) {
  return (
    <section className="min-w-0 p-5 lg:p-7" aria-label="Generated landing page preview">
      <div className="mx-auto mb-5 flex max-w-6xl items-center justify-between gap-4 text-slate-800">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Live Preview</p>
          <strong>{hostname(profile.socials.website)}</strong>
        </div>
        <a href={profile.socials.website || '#'} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black shadow-sm">
          <Icon name="globe" />
          Open
        </a>
      </div>

      <article className="mx-auto max-w-6xl overflow-hidden rounded-lg border border-slate-200 shadow-2xl shadow-slate-900/15" style={{ backgroundColor: profile.colors.background, color: profile.colors.text }}>
        <PreviewHeader profile={profile} />
        <HeroSection profile={profile} services={services} />
        <ServicesSection services={services} colors={profile.colors} />
        <TrustSection profile={profile} />
        <ContactSection profile={profile} />
        <PreviewFooter profile={profile} />
      </article>
    </section>
  )
}

export default function LandingPageGenerator() {
  const [profile, setProfile] = useState(initialProfile)
  const services = useMemo(() => splitServices(profile.services), [profile.services])
  const visibleServices = services.length ? services : ['Consulting', 'Implementation', 'Ongoing support']

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(340px,430px)_minmax(0,1fr)]">
        <GeneratorForm profile={profile} setProfile={setProfile} />
        <LandingPreview profile={profile} services={visibleServices} />
      </div>
    </main>
  )
}
