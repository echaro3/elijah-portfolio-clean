import React, { useMemo, useState } from 'react'

const packageOptions = [
  { value: 'basic', label: 'Basic Landing Page', price: '$400' },
  { value: 'advanced', label: 'Advanced Landing Page', price: '$600' },
]

const goalOptions = [
  ['calls', 'Calls'],
  ['bookings', 'Bookings'],
  ['messages', 'Messages'],
  ['walk-ins', 'Walk-ins'],
]

const vibeOptions = ['modern', 'luxury', 'bold', 'clean', 'urban', 'minimal']

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

const presets = [
  {
    label: 'Barbershop',
    businessName: 'Prime Cut Barbershop',
    industry: 'Barbershop',
    primaryOffer: 'fresh cuts and beard trims',
    targetCustomer: 'local men who want a sharp cut without waiting around',
    businessGoal: 'bookings',
    brandVibe: 'urban',
    packageType: 'basic',
    services: 'Haircuts\nBeard trims\nLineups and fades',
    phone: '(555) 010-2244',
    address: 'Downtown service area',
    colors: { primary: '#0f172a', accent: '#22d3ee', background: '#f8fafc', text: '#111827' },
  },
  {
    label: 'Food Truck',
    businessName: 'Street Sizzle Tacos',
    industry: 'Food truck',
    primaryOffer: 'fresh street tacos for lunch and events',
    targetCustomer: 'hungry locals looking for fast flavorful food',
    businessGoal: 'walk-ins',
    brandVibe: 'bold',
    packageType: 'basic',
    services: 'Street tacos\nCatering trays\nDaily location updates',
    phone: '(555) 010-8831',
    address: 'Serving the west side food truck park',
    colors: { primary: '#b91c1c', accent: '#facc15', background: '#fff7ed', text: '#1f1308' },
  },
  {
    label: 'Auto Detailing',
    businessName: 'Mirror Finish Auto Spa',
    industry: 'Auto detailing',
    primaryOffer: 'mobile detail packages that make cars look new again',
    targetCustomer: 'busy car owners who want premium detailing at home',
    businessGoal: 'bookings',
    brandVibe: 'luxury',
    packageType: 'advanced',
    services: 'Interior deep clean\nExterior wash and wax\nCeramic protection',
    phone: '(555) 010-4097',
    address: 'Mobile service across the metro area',
    colors: { primary: '#111827', accent: '#38bdf8', background: '#f1f5f9', text: '#0f172a' },
  },
  {
    label: 'Cleaning Service',
    businessName: 'Bright Home Cleaning Co.',
    industry: 'Residential cleaning service',
    primaryOffer: 'recurring home cleaning plans',
    targetCustomer: 'families and professionals who want a cleaner home each week',
    businessGoal: 'calls',
    brandVibe: 'clean',
    packageType: 'advanced',
    services: 'Standard home cleaning\nMove-out cleaning\nDeep cleaning add-ons',
    phone: '(555) 010-6188',
    address: 'Serving local neighborhoods and suburbs',
    colors: { primary: '#0f766e', accent: '#67e8f9', background: '#f0fdfa', text: '#134e4a' },
  },
  {
    label: 'Gym / Trainer',
    businessName: 'CoreShift Training',
    industry: 'Personal training gym',
    primaryOffer: 'intro fitness assessment and training plan',
    targetCustomer: 'adults who want accountability and a realistic fitness plan',
    businessGoal: 'bookings',
    brandVibe: 'modern',
    packageType: 'advanced',
    services: 'Personal training\nSmall group sessions\nNutrition check-ins',
    phone: '(555) 010-7754',
    address: 'Northside training studio',
    colors: { primary: '#1d4ed8', accent: '#06b6d4', background: '#eff6ff', text: '#111827' },
  },
  {
    label: 'Nail Salon',
    businessName: 'Gloss House Nails',
    industry: 'Nail salon',
    primaryOffer: 'manicures, pedicures, and custom nail art',
    targetCustomer: 'clients who want a polished appointment-ready salon',
    businessGoal: 'bookings',
    brandVibe: 'luxury',
    packageType: 'advanced',
    services: 'Gel manicures\nPedicures\nCustom nail art',
    phone: '(555) 010-9021',
    address: 'Midtown salon suite',
    colors: { primary: '#9d174d', accent: '#f9a8d4', background: '#fff1f2', text: '#3f0a1f' },
  },
  {
    label: 'Church / Ministry',
    businessName: 'New Hope Community Ministry',
    industry: 'Church and community ministry',
    primaryOffer: 'Sunday worship and local outreach programs',
    targetCustomer: 'families looking for community, worship, and support',
    businessGoal: 'walk-ins',
    brandVibe: 'clean',
    packageType: 'advanced',
    services: 'Sunday service\nYouth programs\nCommunity outreach',
    phone: '(555) 010-3320',
    address: 'Eastside community campus',
    colors: { primary: '#1e3a8a', accent: '#f59e0b', background: '#f8fafc', text: '#172554' },
  },
  {
    label: 'Photographer',
    businessName: 'Golden Hour Portraits',
    industry: 'Portrait photography',
    primaryOffer: 'family and brand photo sessions',
    targetCustomer: 'families and entrepreneurs who need polished photos',
    businessGoal: 'messages',
    brandVibe: 'minimal',
    packageType: 'advanced',
    services: 'Family portraits\nBrand sessions\nEvent coverage',
    phone: '(555) 010-7214',
    address: 'Studio and on-location sessions',
    colors: { primary: '#3f3f46', accent: '#eab308', background: '#fafaf9', text: '#1c1917' },
  },
  {
    label: 'Mobile Mechanic',
    businessName: 'OnCall Mobile Mechanic',
    industry: 'Mobile mechanic',
    primaryOffer: 'same-week mobile diagnostics and repairs',
    targetCustomer: 'drivers who need car help without towing to a shop',
    businessGoal: 'calls',
    brandVibe: 'bold',
    packageType: 'basic',
    services: 'Mobile diagnostics\nBattery and brake service\nEmergency repair visits',
    phone: '(555) 010-6672',
    address: 'Mobile service within 25 miles',
    colors: { primary: '#1e40af', accent: '#f97316', background: '#f8fafc', text: '#111827' },
  },
]

const initialProfile = {
  ...presets[0],
  socials: {
    website: '',
    facebook: '',
    instagram: '',
    linkedin: '',
  },
}

const goalCopy = {
  calls: {
    action: 'get more qualified calls',
    cta: 'Call now',
    channel: 'call',
    trust: 'Phone-first page flow',
    contactHeading: 'Make the next call easy',
    booking: 'Call for a fast quote',
  },
  bookings: {
    action: 'turn visitors into booked appointments',
    cta: 'Book an appointment',
    channel: 'book',
    trust: 'Booking-ready layout',
    contactHeading: 'Turn interest into appointments',
    booking: 'Book the next opening',
  },
  messages: {
    action: 'start more customer conversations',
    cta: 'Send a message',
    channel: 'message',
    trust: 'Message-friendly CTA',
    contactHeading: 'Start the conversation',
    booking: 'Message for availability',
  },
  'walk-ins': {
    action: 'bring more local customers through the door',
    cta: 'Get directions',
    channel: 'visit',
    trust: 'Location-first page flow',
    contactHeading: 'Help nearby customers find you',
    booking: 'Plan a visit today',
  },
}

const vibeCopy = {
  modern: { opener: 'A modern page for', tone: 'clean structure, fresh visuals, and confident calls to action', feel: 'current and trustworthy' },
  luxury: { opener: 'A premium page for', tone: 'refined spacing, polished proof, and high-touch positioning', feel: 'premium before the first conversation' },
  bold: { opener: 'A bold page for', tone: 'strong headlines, punchy sections, and high-contrast CTAs', feel: 'clear, memorable, and ready to act' },
  clean: { opener: 'A clean page for', tone: 'simple hierarchy, calm proof points, and easy next steps', feel: 'easy to understand quickly' },
  urban: { opener: 'A sharp local page for', tone: 'compact copy, local energy, and direct action sections', feel: 'nearby, practical, and ready' },
  minimal: { opener: 'A focused page for', tone: 'minimal copy, quiet design, and one obvious action', feel: 'simple and distraction-free' },
}

function splitServices(value) {
  return value
    .split(/\n|,/)
    .map((service) => service.trim())
    .filter(Boolean)
}

function packageDetails(value) {
  return packageOptions.find((option) => option.value === value) || packageOptions[0]
}

function hostname(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return value.replace(/^https?:\/\//, '') || 'demo-preview.local'
  }
}

function lower(value, fallback) {
  return (value || fallback).trim().toLowerCase()
}

function getGeneratedCopy(profile, services) {
  const goal = goalCopy[profile.businessGoal] || goalCopy.bookings
  const vibe = vibeCopy[profile.brandVibe] || vibeCopy.clean
  const pkg = packageDetails(profile.packageType)
  const offer = profile.primaryOffer || services[0] || 'featured offer'
  const target = profile.targetCustomer || 'local customers'
  const industry = profile.industry || 'small business'
  const packageLine = profile.packageType === 'advanced'
    ? 'The advanced concept adds proof, gallery, FAQ, and booking sections so visitors have more reasons to take action.'
    : 'The basic concept keeps the page focused on the offer, services, contact options, and one clear next step.'

  return {
    headline: `${vibe.opener} ${lower(offer, 'your offer')}.`,
    subheadline: `Built for ${lower(target, 'local customers')} looking for a ${lower(industry, 'small business')} they can trust. This ${pkg.label} uses ${vibe.tone} to ${goal.action}.`,
    primaryCta: goal.cta,
    secondaryCta: profile.businessGoal === 'walk-ins' ? 'View service area' : 'View services',
    trustHeading: `${goal.trust} for a ${profile.brandVibe} ${lower(industry, 'business')} demo`,
    trustBody: `${packageLine} The goal is to help customers quickly understand the offer, feel confident, and ${goal.channel} without digging around.`,
    servicesHeading: `Services that support ${lower(offer, 'the main offer')}`,
    servicesIntro: `Each section is written for ${lower(target, 'local customers')} and points back to the selected goal: ${goal.action}.`,
    aboutHeading: `About ${profile.businessName || 'the business'}`,
    aboutBody: `${profile.businessName || 'This business'} needs a ${profile.brandVibe} online presence that explains the offer quickly, shows what makes the team credible, and helps ${lower(target, 'local customers')} take action.`,
    testimonialHeading: 'What happy customers could say',
    faqHeading: 'Questions customers ask before they act',
    galleryHeading: `${profile.brandVibe} featured work preview`,
    bookingHeading: goal.contactHeading,
    bookingBody: `Use this section to push ${goal.channel}s with a stronger ${pkg.price} demo experience: offer reminder, proof, and a clear CTA in one place.`,
    contactHeading: goal.contactHeading,
    contactBody: `This page gives ${lower(target, 'local customers')} a fast way to see services, trust the business, and ${goal.channel} when they are ready.`,
  }
}

function buildClientPitch(profile) {
  const advancedLine = profile.packageType === 'advanced'
    ? 'This advanced version would include testimonials, a gallery or featured work section, FAQ, and a stronger booking CTA.'
    : 'A basic version would focus on the offer, services, contact buttons, and social/contact links.'

  return `I made a quick landing page concept for ${profile.businessName || 'your business'}. The goal is to help ${lower(profile.targetCustomer, 'customers')} quickly see your ${lower(profile.industry, 'business')}, understand ${lower(profile.primaryOffer, 'your offer')}, and ${goalCopy[profile.businessGoal]?.channel || 'take action'} without having to search around. ${advancedLine} The basic version would be $400, while the advanced version with testimonials, gallery, FAQ, and stronger booking sections would be $600.`
}

function buildProjectBrief(profile, services, generatedCopy, clientPitch) {
  const pkg = packageDetails(profile.packageType)
  const visibleSocials = Object.entries(profile.socials)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`)

  return [
    'Landing Page Demo Brief',
    '',
    `Business name: ${profile.businessName || 'Not provided'}`,
    `Industry: ${profile.industry || 'Not provided'}`,
    `Primary offer: ${profile.primaryOffer || 'Not provided'}`,
    `Target customer: ${profile.targetCustomer || 'Not provided'}`,
    `Business goal: ${profile.businessGoal}`,
    `Brand vibe: ${profile.brandVibe}`,
    `Package: ${pkg.label} (${pkg.price})`,
    `Phone: ${profile.phone || 'Not provided'}`,
    `Address/service area: ${profile.address || 'Not provided'}`,
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
    'Social/contact links:',
    ...(visibleSocials.length ? visibleSocials.map((line) => `- ${line}`) : ['- Not provided']),
    '',
    'Generated page copy:',
    `Headline: ${generatedCopy.headline}`,
    `Subheadline: ${generatedCopy.subheadline}`,
    `Primary CTA: ${generatedCopy.primaryCta}`,
    `Trust heading: ${generatedCopy.trustHeading}`,
    `Trust body: ${generatedCopy.trustBody}`,
    `Contact heading: ${generatedCopy.contactHeading}`,
    `Contact body: ${generatedCopy.contactBody}`,
    '',
    'Client pitch:',
    clientPitch,
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

  if (name === 'phone') return <svg {...common}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L8 9.72a16 16 0 0 0 6.28 6.28l1.29-1.28a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92Z" /></svg>
  if (name === 'map') return <svg {...common}><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
  if (name === 'arrow') return <svg {...common}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
  if (name === 'globe') return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 0 20" /><path d="M12 2a15.3 15.3 0 0 0 0 20" /></svg>
  if (name === 'copy') return <svg {...common}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
  if (name === 'reset') return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v6h6" /></svg>
  return <svg {...common}><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15Z" /></svg>
}

function TextField({ label, value, placeholder, type = 'text', onChange }) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-slate-700/70 bg-slate-950/70 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/20"
      />
    </label>
  )
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-slate-700/70 bg-slate-950/70 px-3 text-sm font-bold text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/20"
      >
        {options.map((option) => {
          const value = Array.isArray(option) ? option[0] : option.value || option
          const label = Array.isArray(option) ? option[1] : option.label ? `${option.label} (${option.price})` : option
          return <option key={value} value={value}>{label}</option>
        })}
      </select>
    </label>
  )
}

function TextArea({ label, value, placeholder, onChange, rows = 4 }) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <textarea value={value} placeholder={placeholder} rows={rows} onChange={(event) => onChange(event.target.value)} className="resize-y rounded-lg border border-slate-700/70 bg-slate-950/70 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/20" />
    </label>
  )
}

function FieldGroup({ title, icon, children }) {
  return (
    <fieldset className="rounded-lg border border-white/10 bg-white/[0.03] p-4 shadow-sm">
      <legend className="flex items-center gap-2 px-2 text-sm font-black text-white">
        <Icon name={icon} />
        {title}
      </legend>
      <div className="mt-3 grid gap-4">{children}</div>
    </fieldset>
  )
}

function ActionButton({ children, onClick, tone = 'dark' }) {
  const className = tone === 'cyan'
    ? 'inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg bg-cyan-400 px-3 text-xs font-black text-slate-950 transition hover:bg-cyan-300'
    : 'inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 text-xs font-black text-white transition hover:bg-white/15'

  return <button type="button" onClick={onClick} className={className}>{children}</button>
}

function PresetButtons({ onSelect }) {
  return (
    <FieldGroup title="Industry Presets" icon="sparkles">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onSelect(preset)}
            className="min-h-[36px] rounded-lg border border-white/10 bg-slate-950/60 px-2 text-xs font-bold text-slate-200 transition hover:border-cyan-300/70 hover:bg-cyan-300/10 hover:text-white"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </FieldGroup>
  )
}

function GeneratorForm({ profile, setProfile }) {
  const updateField = (field, value) => setProfile((current) => ({ ...current, [field]: value }))
  const updateColors = (field, value) => setProfile((current) => ({ ...current, colors: { ...current.colors, [field]: value } }))
  const updateSocials = (field, value) => setProfile((current) => ({ ...current, socials: { ...current.socials, [field]: value } }))

  function applyPreset(preset) {
    setProfile((current) => ({
      ...current,
      ...preset,
      socials: current.socials,
    }))
  }

  return (
    <section className="border-b border-white/10 bg-slate-950 p-4 text-white lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-6">
      <header className="mb-5 rounded-xl border border-cyan-400/20 bg-gradient-to-br from-blue-950 via-slate-950 to-slate-900 p-4 shadow-2xl shadow-blue-950/20">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-400 text-slate-950">
            <Icon name="sparkles" className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Landing Page Demo Builder</h1>
            <p className="text-sm leading-6 text-slate-300">Create quick small business landing page concepts for client demos.</p>
          </div>
        </div>
        <p className="text-xs leading-5 text-slate-400">Pick a preset, adjust the offer, then copy a project brief or client-ready pitch.</p>
      </header>

      <form className="grid gap-5">
        <PresetButtons onSelect={applyPreset} />

        <FieldGroup title="Client Details" icon="sparkles">
          <TextField label="Business name" value={profile.businessName} placeholder="Business name" onChange={(value) => updateField('businessName', value)} />
          <TextField label="Industry" value={profile.industry} placeholder="Barbershop, food truck, cleaning service..." onChange={(value) => updateField('industry', value)} />
          <TextField label="Primary offer" value={profile.primaryOffer} placeholder="Offer, promo, or main service" onChange={(value) => updateField('primaryOffer', value)} />
          <TextField label="Target customer" value={profile.targetCustomer} placeholder="Who this page should convert" onChange={(value) => updateField('targetCustomer', value)} />
          <TextArea label="Services" value={profile.services} placeholder="One service per line" onChange={(value) => updateField('services', value)} />
        </FieldGroup>

        <FieldGroup title="Demo Strategy" icon="copy">
          <SelectField label="Business goal" value={profile.businessGoal} options={goalOptions} onChange={(value) => updateField('businessGoal', value)} />
          <SelectField label="Brand vibe" value={profile.brandVibe} options={vibeOptions} onChange={(value) => updateField('brandVibe', value)} />
          <SelectField label="Package type" value={profile.packageType} options={packageOptions} onChange={(value) => updateField('packageType', value)} />
        </FieldGroup>

        <FieldGroup title="Contact" icon="map">
          <TextField label="Phone placeholder" value={profile.phone} placeholder="(555) 000-0000" type="tel" onChange={(value) => updateField('phone', value)} />
          <TextField label="Address / service area" value={profile.address} placeholder="City, location, or service area" onChange={(value) => updateField('address', value)} />
        </FieldGroup>

        <FieldGroup title="Brand Colors" icon="sparkles">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {colorFields.map(([key, label]) => (
              <label key={key} className="grid gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
                <div className="grid grid-cols-[42px_minmax(0,1fr)] items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/70 p-2">
                  <input aria-label={`${label} color`} type="color" value={profile.colors[key]} onChange={(event) => updateColors(key, event.target.value)} className="h-8 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0" />
                  <code className="truncate text-xs font-semibold uppercase text-slate-400">{profile.colors[key]}</code>
                </div>
              </label>
            ))}
          </div>
        </FieldGroup>

        <FieldGroup title="Social / Contact Links" icon="globe">
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
    <header className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
      <a href="/" className="flex min-w-0 items-center gap-3 font-black" aria-label="Back to portfolio home">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm text-white" style={{ backgroundColor: profile.colors.primary }}>
          {(profile.businessName || 'D').slice(0, 1)}
        </span>
        <span className="truncate">{profile.businessName || 'Demo Business'}</span>
      </a>
      <nav className="flex flex-wrap gap-4 text-sm font-bold opacity-80" aria-label="Generated preview navigation">
        <a href="#services">Services</a>
        {profile.packageType === 'advanced' ? <a href="#work">Work</a> : null}
        <a href="#contact">Contact</a>
      </nav>
    </header>
  )
}

function HeroSection({ profile, generatedCopy }) {
  const href = profile.businessGoal === 'walk-ins' ? `https://maps.google.com/?q=${encodeURIComponent(profile.address)}` : `tel:${profile.phone}`

  return (
    <section className="grid items-center gap-8 px-5 pb-12 pt-6 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:pb-16 md:pt-10">
      <div className="grid gap-5">
        <p className="w-fit rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wide text-white" style={{ backgroundColor: profile.colors.primary }}>
          {packageDetails(profile.packageType).label} {packageDetails(profile.packageType).price}
        </p>
        <h2 className="max-w-3xl text-4xl font-black leading-none tracking-normal sm:text-5xl lg:text-6xl">{generatedCopy.headline}</h2>
        <p className="max-w-2xl text-base leading-8 opacity-75 sm:text-lg">{generatedCopy.subheadline}</p>
        <div className="flex flex-wrap gap-3">
          <a href={href} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-black text-white shadow-xl" style={{ backgroundColor: profile.colors.primary }}>
            <Icon name={profile.businessGoal === 'walk-ins' ? 'map' : 'phone'} />
            {generatedCopy.primaryCta}
          </a>
          <a href="#services" className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white/70 px-4 text-sm font-black">
            {generatedCopy.secondaryCta}
            <Icon name="arrow" />
          </a>
        </div>
      </div>

      <aside className="relative min-h-[310px] overflow-hidden rounded-lg p-6 text-white shadow-2xl" style={{ background: `linear-gradient(145deg, ${profile.colors.primary}, #0f172a)` }} aria-label="Generated brand card">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/30" />
        <div className="absolute -left-20 bottom-10 h-48 w-48 rounded-full border border-white/25" />
        <div className="absolute right-12 bottom-16 h-20 w-20 rounded-full opacity-80" style={{ backgroundColor: profile.colors.accent }} />
        <div className="relative grid min-h-[270px] content-end gap-4">
          <p className="text-xs font-black uppercase tracking-wide text-white/70">{profile.industry || 'Client industry'}</p>
          <h3 className="text-4xl font-black leading-none sm:text-5xl">{profile.primaryOffer || profile.businessName}</h3>
          <div className="flex w-fit items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white/90"><Icon name="sparkles" />{profile.brandVibe} brand vibe</div>
          <div className="flex w-fit items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white/90"><Icon name="map" />{profile.address || 'Service area'}</div>
        </div>
      </aside>
    </section>
  )
}

function ServicesSection({ services, colors, generatedCopy }) {
  return (
    <section id="services" className="px-5 py-14 md:px-8">
      <div className="mb-8 max-w-3xl">
        <h2 className="text-3xl font-black leading-tight sm:text-4xl">{generatedCopy.servicesHeading}</h2>
        <p className="mt-3 text-base leading-7 opacity-70">{generatedCopy.servicesIntro}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {services.map((service, index) => (
          <article key={`${service}-${index}`} className="grid min-h-[190px] content-between rounded-lg border border-slate-200 bg-white/70 p-5 shadow-sm">
            <span className="grid h-10 w-10 place-items-center rounded-lg text-xs font-black" style={{ backgroundColor: `${index % 2 === 0 ? colors.primary : colors.accent}22`, color: index % 2 === 0 ? colors.primary : '#9a6a00' }}>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h3 className="text-xl font-black leading-tight">{service}</h3>
              <p className="mt-3 text-sm leading-6 opacity-70">Short service copy can explain value, reduce hesitation, and point back to the main CTA.</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function TrustSection({ profile, generatedCopy }) {
  const goal = goalCopy[profile.businessGoal] || goalCopy.bookings
  const points = [
    [goal.trust, packageDetails(profile.packageType).label],
    ['For', profile.targetCustomer || 'Local customers'],
    ['Goal', goal.action],
  ]

  return (
    <section className="grid gap-8 px-5 py-14 md:grid-cols-[0.9fr_1.1fr] md:px-8" style={{ backgroundColor: `${profile.colors.primary}12` }}>
      <div>
        <h2 className="text-3xl font-black leading-tight sm:text-4xl">{generatedCopy.trustHeading}</h2>
        <p className="mt-4 text-base leading-7 opacity-70">{generatedCopy.trustBody}</p>
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

function BasicContactLinks({ profile }) {
  const visibleSocials = socialFields.filter(([key]) => profile.socials[key])

  return (
    <section className="px-5 py-12 md:px-8">
      <div className="rounded-lg border border-slate-200 bg-white/75 p-5">
        <h2 className="text-2xl font-black">Contact and social links</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={`tel:${profile.phone}`} className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-black"><Icon name="phone" />{profile.phone}</a>
          <a href={`https://maps.google.com/?q=${encodeURIComponent(profile.address)}`} className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-black"><Icon name="map" />{profile.address}</a>
          {visibleSocials.map(([key, label]) => (
            <a key={key} href={profile.socials[key]} className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-black"><Icon name={key === 'website' ? 'globe' : 'arrow'} />{label}</a>
          ))}
        </div>
      </div>
    </section>
  )
}

function AdvancedSections({ profile, generatedCopy }) {
  const faqs = [
    ['How fast can someone get started?', `They can ${goalCopy[profile.businessGoal]?.channel || 'reach out'} as soon as they are ready, using the primary CTA.`],
    ['What makes this business different?', `The page can highlight the ${profile.brandVibe} experience, customer proof, and the main offer.`],
    ['What should the customer do next?', generatedCopy.primaryCta],
  ]

  return (
    <>
      <section className="px-5 py-14 md:px-8">
        <div className="grid gap-6 rounded-lg border border-slate-200 bg-white/70 p-6 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-wide opacity-60">About section</p>
            <h2 className="mt-2 text-3xl font-black">{generatedCopy.aboutHeading}</h2>
          </div>
          <p className="text-base leading-8 opacity-75">{generatedCopy.aboutBody}</p>
        </div>
      </section>

      <section className="px-5 py-14 md:px-8">
        <h2 className="text-3xl font-black">{generatedCopy.testimonialHeading}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {['Clear and easy to book.', 'Professional from start to finish.', 'Exactly what I needed locally.'].map((quote) => (
            <blockquote key={quote} className="rounded-lg border border-slate-200 bg-white/75 p-5 text-sm leading-7 shadow-sm">"{quote}"<footer className="mt-4 font-black opacity-70">Demo customer</footer></blockquote>
          ))}
        </div>
      </section>

      <section id="work" className="px-5 py-14 md:px-8">
        <div className="mb-6">
          <h2 className="text-3xl font-black">{generatedCopy.galleryHeading}</h2>
          <p className="mt-3 leading-7 opacity-70">Placeholder blocks can become before-and-after photos, food shots, haircut photos, service examples, or event highlights.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="grid aspect-[4/3] place-items-center rounded-lg border border-dashed border-slate-300 bg-white/60 text-sm font-black opacity-70">Featured work {item}</div>
          ))}
        </div>
      </section>

      <section className="px-5 py-14 md:px-8">
        <h2 className="text-3xl font-black">{generatedCopy.faqHeading}</h2>
        <div className="mt-6 grid gap-3">
          {faqs.map(([question, answer]) => (
            <div key={question} className="rounded-lg border border-slate-200 bg-white/75 p-5">
              <h3 className="font-black">{question}</h3>
              <p className="mt-2 text-sm leading-6 opacity-70">{answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-14 text-white md:px-8" style={{ backgroundColor: profile.colors.primary }}>
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-3xl font-black">{generatedCopy.bookingHeading}</h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/75">{generatedCopy.bookingBody}</p>
          </div>
          <a href={`tel:${profile.phone}`} className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-white px-4 text-sm font-black" style={{ color: profile.colors.primary }}>{goalCopy[profile.businessGoal]?.booking || 'Take action'}</a>
        </div>
      </section>
    </>
  )
}

function ContactSection({ profile, generatedCopy }) {
  return (
    <section id="contact" className="grid gap-7 px-5 py-14 text-white md:grid-cols-[1fr_auto] md:items-center md:px-8" style={{ backgroundColor: profile.colors.text }}>
      <div className="max-w-3xl">
        <h2 className="text-3xl font-black leading-tight sm:text-4xl">{generatedCopy.contactHeading}</h2>
        <p className="mt-4 text-base leading-7 text-white/70">{generatedCopy.contactBody}</p>
      </div>
      <div className="grid gap-3">
        <a href={`tel:${profile.phone}`} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-black" style={{ color: profile.colors.text }}><Icon name="phone" />{profile.phone || 'Call'}</a>
        <a href={`https://maps.google.com/?q=${encodeURIComponent(profile.address)}`} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-black" style={{ color: profile.colors.text }}><Icon name="map" />{profile.address || 'Map'}</a>
      </div>
    </section>
  )
}

function PreviewFooter({ profile }) {
  return (
    <footer className="flex flex-col gap-4 px-5 py-7 text-sm font-bold opacity-80 sm:flex-row sm:items-center sm:justify-between md:px-8">
      <span>{profile.businessName || 'Demo Business'}</span>
      <span>{packageDetails(profile.packageType).label} demo</span>
    </footer>
  )
}

function OutputPanel({ projectBrief, clientPitch, onCopyBrief, onCopyPitch, onReset, copyStatus }) {
  return (
    <section className="mx-auto mt-5 grid max-w-6xl gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-white">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-black uppercase tracking-wide text-cyan-200">Project Brief</h2>
          <ActionButton onClick={onCopyBrief} tone="cyan"><Icon name="copy" />Copy Project Brief</ActionButton>
        </div>
        <textarea readOnly value={projectBrief} rows={10} className="w-full resize-y rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-xs leading-5 text-slate-200 outline-none" />
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-white">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-black uppercase tracking-wide text-cyan-200">Client Pitch</h2>
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={onCopyPitch} tone="cyan"><Icon name="copy" />Copy Client Pitch</ActionButton>
            <ActionButton onClick={onReset}><Icon name="reset" />Reset Demo</ActionButton>
          </div>
        </div>
        <textarea readOnly value={clientPitch} rows={10} className="w-full resize-y rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-xs leading-5 text-slate-200 outline-none" />
      </div>
      {copyStatus ? <p className="lg:col-span-2 text-sm font-bold text-cyan-700">{copyStatus}</p> : null}
    </section>
  )
}

function LandingPreview({ profile, services, generatedCopy }) {
  const isAdvanced = profile.packageType === 'advanced'

  return (
    <section className="min-w-0 p-4 lg:p-6" aria-label="Generated landing page preview">
      <div className="mx-auto mb-5 max-w-6xl text-slate-200">
        <p className="text-xs font-black uppercase tracking-wide text-cyan-300">Client-facing Preview</p>
        <strong className="text-white">{hostname(profile.socials.website)}</strong>
      </div>

      <article className="mx-auto max-w-6xl overflow-hidden rounded-lg border border-slate-200 shadow-2xl shadow-blue-950/20" style={{ backgroundColor: profile.colors.background, color: profile.colors.text }}>
        <PreviewHeader profile={profile} />
        <HeroSection profile={profile} generatedCopy={generatedCopy} />
        <ServicesSection services={services} colors={profile.colors} generatedCopy={generatedCopy} />
        <TrustSection profile={profile} generatedCopy={generatedCopy} />
        {isAdvanced ? <AdvancedSections profile={profile} generatedCopy={generatedCopy} /> : <BasicContactLinks profile={profile} />}
        <ContactSection profile={profile} generatedCopy={generatedCopy} />
        <PreviewFooter profile={profile} />
      </article>
    </section>
  )
}

export default function LandingPageGenerator() {
  const [profile, setProfile] = useState(initialProfile)
  const [copyStatus, setCopyStatus] = useState('')
  const services = useMemo(() => splitServices(profile.services), [profile.services])
  const visibleServices = services.length ? services : ['Primary service', 'Support service', 'Follow-up service']
  const generatedCopy = useMemo(() => getGeneratedCopy(profile, visibleServices), [profile, visibleServices])
  const clientPitch = useMemo(() => buildClientPitch(profile, generatedCopy), [profile, generatedCopy])
  const projectBrief = useMemo(() => buildProjectBrief(profile, visibleServices, generatedCopy, clientPitch), [profile, visibleServices, generatedCopy, clientPitch])

  async function copyText(label, text) {
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus(`${label} copied to clipboard.`)
    } catch {
      setCopyStatus(`Copy failed. Select the ${label.toLowerCase()} text and copy it manually.`)
    }
  }

  function resetDemo() {
    setProfile(initialProfile)
    setCopyStatus('Demo reset to the default barbershop preset.')
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(320px,460px)_minmax(0,1fr)]">
        <GeneratorForm profile={profile} setProfile={setProfile} />
        <div className="min-w-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_28%),linear-gradient(180deg,_#0f172a,_#111827)]">
          <LandingPreview profile={profile} services={visibleServices} generatedCopy={generatedCopy} />
          <div className="px-4 pb-6 lg:px-6">
            <OutputPanel
              projectBrief={projectBrief}
              clientPitch={clientPitch}
              onCopyBrief={() => copyText('Project brief', projectBrief)}
              onCopyPitch={() => copyText('Client pitch', clientPitch)}
              onReset={resetDemo}
              copyStatus={copyStatus}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
