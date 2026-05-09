import React, { useMemo, useState } from 'react'

const initialProfile = {
  businessName: 'Neighborhood Wellness Clinic',
  industry: 'Health and wellness clinic',
  primaryOffer: 'New client wellness consultation',
  targetCustomer: 'busy adults who want a simple path to better care',
  businessGoal: 'bookings',
  brandVibe: 'clean',
  packageType: 'Basic Landing Page',
  services: 'Wellness consultations\nPersonalized care plans\nFollow-up support',
  phone: '(555) 013-4488',
  address: 'Your City, ST',
  colors: {
    primary: '#136f63',
    accent: '#f2b84b',
    background: '#f8faf7',
    text: '#13201d',
  },
  socials: {
    website: '',
    facebook: '',
    instagram: '',
    linkedin: '',
  },
}

const colorFields = [
  ['primary', 'Primary'],
  ['accent', 'Accent'],
  ['background', 'Background'],
  ['text', 'Text'],
]

const socialFields = [
  ['website', 'Website', 'https://example.com'],
  ['facebook', 'Facebook', 'https://facebook.com/yourpage'],
  ['instagram', 'Instagram', 'https://instagram.com/yourhandle'],
  ['linkedin', 'LinkedIn', 'https://linkedin.com/company/yourbrand'],
]

const goalOptions = [
  ['calls', 'Calls'],
  ['bookings', 'Bookings'],
  ['messages', 'Messages'],
  ['walk-ins', 'Walk-ins'],
]

const vibeOptions = ['modern', 'luxury', 'bold', 'clean', 'urban', 'minimal']
const packageOptions = ['Basic Landing Page', 'Advanced Landing Page']

const goalCopy = {
  calls: {
    action: 'drive more qualified calls',
    cta: 'Call now',
    proof: 'Phone-first page flow',
    contactHeading: 'Ready for more calls?',
    contactBody: 'Put the phone number in front of the right people and make the next step feel immediate.',
  },
  bookings: {
    action: 'turn visitors into booked appointments',
    cta: 'Book now',
    proof: 'Booking-ready layout',
    contactHeading: 'Ready to get booked?',
    contactBody: 'Guide visitors from interest to appointment with a page built around one clear offer.',
  },
  messages: {
    action: 'start more customer conversations',
    cta: 'Send a message',
    proof: 'Message-friendly CTA',
    contactHeading: 'Ready for more messages?',
    contactBody: 'Give interested customers a low-friction way to ask questions and take the next step.',
  },
  'walk-ins': {
    action: 'bring more local customers through the door',
    cta: 'Get directions',
    proof: 'Location-first page flow',
    contactHeading: 'Ready for more walk-ins?',
    contactBody: 'Make the location, offer, and reason to visit obvious for nearby customers.',
  },
}

const vibeCopy = {
  modern: {
    opener: 'A polished, modern page for',
    tone: 'fresh visuals, confident spacing, and direct calls to action',
    benefit: 'feel current and trustworthy',
  },
  luxury: {
    opener: 'A premium landing page for',
    tone: 'refined messaging, elegant pacing, and high-touch positioning',
    benefit: 'feel elevated before the first conversation',
  },
  bold: {
    opener: 'A bold conversion page for',
    tone: 'strong headlines, high-contrast sections, and decisive CTAs',
    benefit: 'act fast and remember the offer',
  },
  clean: {
    opener: 'A clean landing page for',
    tone: 'simple hierarchy, calm proof points, and easy next steps',
    benefit: 'understand the offer without friction',
  },
  urban: {
    opener: 'A sharp local landing page for',
    tone: 'street-smart copy, compact sections, and clear neighborhood relevance',
    benefit: 'see the business as close, practical, and ready',
  },
  minimal: {
    opener: 'A minimal landing page for',
    tone: 'focused copy, fewer distractions, and one obvious action',
    benefit: 'move from interest to action quickly',
  },
}

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
    return value.replace(/^https?:\/\//, '') || 'client-site.com'
  }
}

function sentenceEnd(value) {
  const trimmed = value.trim() || 'your business'
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

function lower(value, fallback) {
  return (value || fallback).trim().toLowerCase()
}

function getGeneratedCopy(profile, services) {
  const goal = goalCopy[profile.businessGoal] || goalCopy.bookings
  const vibe = vibeCopy[profile.brandVibe] || vibeCopy.clean
  const offer = profile.primaryOffer || services[0] || 'featured offer'
  const target = profile.targetCustomer || 'local customers'
  const industry = profile.industry || 'small business'
  const packageIntro = profile.packageType === 'Advanced Landing Page'
    ? 'A deeper page structure with proof, service detail, and conversion sections'
    : 'A focused one-page preview with hero, services, proof, and contact sections'

  return {
    headline: `${vibe.opener} ${lower(offer, 'your offer')}.`,
    subheadline: `Built for ${lower(target, 'local customers')} looking for a ${lower(industry, 'small business')} they can trust. The page uses ${vibe.tone} to ${goal.action}.`,
    serviceHeading: `${packageIntro} for ${lower(industry, 'your business')}`,
    serviceIntro: `Each service card supports the primary offer and helps ${lower(target, 'local customers')} understand what to do next.`,
    proofHeading: `${profile.brandVibe} proof that supports ${lower(profile.businessGoal, 'bookings')}`,
    proofBody: `Use this area for testimonials, before-and-after results, guarantees, FAQs, or local trust signals that help visitors ${vibe.benefit}.`,
    contactHeading: goal.contactHeading,
    contactBody: goal.contactBody,
    cta: goal.cta,
    proof: goal.proof,
  }
}

function buildProjectBrief(profile, services, generatedCopy) {
  const visibleSocials = Object.entries(profile.socials)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`)

  return [
    'Client Landing Page Brief',
    '',
    `Business name: ${profile.businessName || 'Not provided'}`,
    `Industry: ${profile.industry || 'Not provided'}`,
    `Primary offer: ${profile.primaryOffer || 'Not provided'}`,
    `Target customer: ${profile.targetCustomer || 'Not provided'}`,
    `Business goal: ${profile.businessGoal}`,
    `Brand vibe: ${profile.brandVibe}`,
    `Package type: ${profile.packageType}`,
    `Phone: ${profile.phone || 'Not provided'}`,
    `Address: ${profile.address || 'Not provided'}`,
    '',
    'Brand colors:',
    `Primary: ${profile.colors.primary}`,
    `Accent: ${profile.colors.accent}`,
    `Background: ${profile.colors.background}`,
    `Text: ${profile.colors.text}`,
    '',
    'Services:',
    ...(services.length ? services.map((service) => `- ${service}`) : ['- Not provided']),
    '',
    'Social links:',
    ...(visibleSocials.length ? visibleSocials.map((line) => `- ${line}`) : ['- Not provided']),
    '',
    'Generated page copy:',
    `Headline: ${generatedCopy.headline}`,
    `Subheadline: ${generatedCopy.subheadline}`,
    `Services heading: ${generatedCopy.serviceHeading}`,
    `Services intro: ${generatedCopy.serviceIntro}`,
    `Proof heading: ${generatedCopy.proofHeading}`,
    `Proof body: ${generatedCopy.proofBody}`,
    `Contact heading: ${generatedCopy.contactHeading}`,
    `Contact body: ${generatedCopy.contactBody}`,
    `Primary CTA: ${generatedCopy.cta}`,
  ].join('\n')
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

  if (name === 'copy') {
    return <svg {...common}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
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

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
      >
        {options.map((option) => {
          const value = Array.isArray(option) ? option[0] : option
          const label = Array.isArray(option) ? option[1] : option
          return <option key={value} value={value}>{label}</option>
        })}
      </select>
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

function GeneratorForm({ profile, setProfile, projectBrief }) {
  const [briefStatus, setBriefStatus] = useState('')
  const updateField = (field, value) => setProfile((current) => ({ ...current, [field]: value }))
  const updateColors = (field, value) => setProfile((current) => ({ ...current, colors: { ...current.colors, [field]: value } }))
  const updateSocials = (field, value) => setProfile((current) => ({ ...current, socials: { ...current.socials, [field]: value } }))

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(projectBrief)
      setBriefStatus('Project brief copied to clipboard.')
    } catch {
      setBriefStatus('Copy failed. Select the brief text below and copy it manually.')
    }
  }

  return (
    <section className="border-b border-slate-200 bg-white/85 p-5 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-7">
      <header className="mb-6 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-emerald-700 text-white shadow-lg shadow-emerald-900/20">
          <Icon name="sparkles" className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-950">Client Landing Page Builder</h1>
          <p className="text-sm leading-6 text-slate-500">Build a quick landing page preview for a small business.</p>
        </div>
      </header>

      <form className="grid gap-5">
        <FieldGroup title="Client Details" icon="sparkles">
          <TextField label="Business name" value={profile.businessName} placeholder="Business name" onChange={(value) => updateField('businessName', value)} />
          <TextField label="Industry" value={profile.industry} placeholder="Dental clinic, coffee shop, salon..." onChange={(value) => updateField('industry', value)} />
          <TextField label="Primary offer" value={profile.primaryOffer} placeholder="Free consultation, grand opening special..." onChange={(value) => updateField('primaryOffer', value)} />
          <TextField label="Target customer" value={profile.targetCustomer} placeholder="Busy parents, homeowners, local professionals..." onChange={(value) => updateField('targetCustomer', value)} />
          <TextArea label="Services" value={profile.services} placeholder="One service per line" onChange={(value) => updateField('services', value)} />
        </FieldGroup>

        <FieldGroup title="Page Strategy" icon="copy">
          <SelectField label="Business goal" value={profile.businessGoal} options={goalOptions} onChange={(value) => updateField('businessGoal', value)} />
          <SelectField label="Brand vibe" value={profile.brandVibe} options={vibeOptions} onChange={(value) => updateField('brandVibe', value)} />
          <SelectField label="Package type" value={profile.packageType} options={packageOptions} onChange={(value) => updateField('packageType', value)} />
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

        <FieldGroup title="Project Brief" icon="copy">
          <button type="button" onClick={copyBrief} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-emerald-800">
            <Icon name="copy" />
            Copy Project Brief
          </button>
          {briefStatus ? <p className="text-sm font-semibold text-emerald-700">{briefStatus}</p> : null}
          <textarea readOnly value={projectBrief} rows={8} className="resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-700" aria-label="Generated project brief" />
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
          {(profile.businessName || 'C').slice(0, 1)}
        </span>
        <span className="truncate">{profile.businessName || 'Client Business'}</span>
      </a>
      <nav className="flex gap-5 text-sm font-bold opacity-80" aria-label="Generated preview navigation">
        <a href="#services">Services</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  )
}

function HeroSection({ profile, services, generatedCopy }) {
  return (
    <section className="grid items-center gap-8 px-5 pb-14 pt-8 md:grid-cols-[1.1fr_0.9fr] md:px-10 md:pb-20 md:pt-12">
      <div className="grid gap-5">
        <p className="w-fit rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wide text-white" style={{ backgroundColor: profile.colors.primary }}>
          {profile.packageType}
        </p>
        <h2 className="max-w-3xl text-4xl font-black leading-none tracking-normal sm:text-5xl lg:text-6xl">
          {generatedCopy.headline}
        </h2>
        <p className="max-w-2xl text-base leading-8 opacity-75 sm:text-lg">
          {generatedCopy.subheadline}
        </p>
        <div className="flex flex-wrap gap-3">
          <a href={profile.businessGoal === 'walk-ins' ? `https://maps.google.com/?q=${encodeURIComponent(profile.address)}` : `tel:${profile.phone}`} className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-black text-white shadow-xl" style={{ backgroundColor: profile.colors.primary }}>
            <Icon name={profile.businessGoal === 'walk-ins' ? 'map' : 'phone'} />
            {generatedCopy.cta}
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
          <p className="text-xs font-black uppercase tracking-wide text-white/70">{profile.industry || 'Client industry'}</p>
          <h3 className="text-4xl font-black leading-none sm:text-5xl">{sentenceEnd(profile.primaryOffer || profile.businessName)}</h3>
          <div className="flex w-fit items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white/90"><Icon name="sparkles" />{profile.brandVibe} brand vibe</div>
          <div className="flex w-fit items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white/90"><Icon name="map" />{profile.address || 'Service area'}</div>
        </div>
      </aside>
    </section>
  )
}

function ServicesSection({ services, colors, generatedCopy }) {
  return (
    <section id="services" className="px-5 py-16 md:px-10">
      <div className="mb-8 max-w-3xl">
        <h2 className="text-3xl font-black leading-tight sm:text-4xl">{generatedCopy.serviceHeading}</h2>
        <p className="mt-3 text-base leading-7 opacity-70">{generatedCopy.serviceIntro}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {services.map((service, index) => (
          <article key={`${service}-${index}`} className="grid min-h-[210px] content-between rounded-lg border border-slate-200 bg-white/70 p-5 shadow-sm">
            <span className="grid h-10 w-10 place-items-center rounded-lg text-xs font-black" style={{ backgroundColor: `${index % 2 === 0 ? colors.primary : colors.accent}22`, color: index % 2 === 0 ? colors.primary : '#9a6a00' }}>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h3 className="text-xl font-black leading-tight">{service}</h3>
              <p className="mt-3 text-sm leading-6 opacity-70">Support the offer with specific value, proof, and a clear path toward the selected business goal.</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function TrustSection({ profile, generatedCopy }) {
  const points = [
    [generatedCopy.proof, profile.packageType],
    ['Targeted', profile.targetCustomer || 'Local customers'],
    ['Goal', goalCopy[profile.businessGoal]?.action || 'convert visitors'],
  ]

  return (
    <section className="grid gap-8 px-5 py-16 md:grid-cols-[0.9fr_1.1fr] md:px-10" style={{ backgroundColor: `${profile.colors.primary}12` }}>
      <div>
        <h2 className="text-3xl font-black leading-tight sm:text-4xl">{generatedCopy.proofHeading}</h2>
        <p className="mt-4 text-base leading-7 opacity-70">{generatedCopy.proofBody}</p>
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

function ContactSection({ profile, generatedCopy }) {
  return (
    <section id="contact" className="grid gap-7 px-5 py-16 text-white md:grid-cols-[1fr_auto] md:items-center md:px-10" style={{ backgroundColor: profile.colors.text }}>
      <div className="max-w-3xl">
        <h2 className="text-3xl font-black leading-tight sm:text-4xl">{generatedCopy.contactHeading}</h2>
        <p className="mt-4 text-base leading-7 text-white/70">{generatedCopy.contactBody}</p>
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
      <span>{profile.businessName || 'Client Business'}</span>
      {visibleSocials.length ? (
        <div className="flex flex-wrap gap-2">
          {visibleSocials.map(([key, label]) => (
            <a key={key} href={profile.socials[key]} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300" aria-label={label}>
              <Icon name={key === 'website' ? 'globe' : 'arrow'} />
            </a>
          ))}
        </div>
      ) : null}
    </footer>
  )
}

function LandingPreview({ profile, services, generatedCopy }) {
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
        <HeroSection profile={profile} services={services} generatedCopy={generatedCopy} />
        <ServicesSection services={services} colors={profile.colors} generatedCopy={generatedCopy} />
        <TrustSection profile={profile} generatedCopy={generatedCopy} />
        <ContactSection profile={profile} generatedCopy={generatedCopy} />
        <PreviewFooter profile={profile} />
      </article>
    </section>
  )
}

export default function LandingPageGenerator() {
  const [profile, setProfile] = useState(initialProfile)
  const services = useMemo(() => splitServices(profile.services), [profile.services])
  const visibleServices = services.length ? services : ['Primary service', 'Support service', 'Follow-up service']
  const generatedCopy = useMemo(() => getGeneratedCopy(profile, visibleServices), [profile, visibleServices])
  const projectBrief = useMemo(() => buildProjectBrief(profile, visibleServices, generatedCopy), [profile, visibleServices, generatedCopy])

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(340px,460px)_minmax(0,1fr)]">
        <GeneratorForm profile={profile} setProfile={setProfile} projectBrief={projectBrief} />
        <LandingPreview profile={profile} services={visibleServices} generatedCopy={generatedCopy} />
      </div>
    </main>
  )
}
