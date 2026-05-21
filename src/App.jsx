import React, { useEffect, useState } from "react";

const projects = {
  tasker: { title: "Tasker Operations Dashboard", tag: "Power BI / SharePoint", description: "Interactive reporting for task status, suspense tracking, overdue items, and leadership visibility.", impact: "Designed to replace scattered manual tracking with centralized performance insights and operational decision support." },
  sharepoint: { title: "SharePoint Automation Suite", tag: "Power Automate / M365", description: "Workflow automation patterns for routing documents, sending notifications, managing approvals, and tracking lifecycle status.", impact: "Reduces repetitive admin work while preserving accountability, visibility, and process consistency." },
  knowledge: { title: "Knowledge & Records Management", tag: "KM / Governance", description: "Experience supporting knowledge management practices, FOIA/508 documentation, and shared-drive governance.", impact: "Bridges operational requirements with clean digital structure, documentation, and compliance-minded processes." }
};

const skills = ["Data Engineering", "Power BI", "Power Apps", "Power Automate", "SharePoint", "Microsoft 365", "Data Pipelines", "Operations Modernization"];

const services = [
  { title: "Data Engineering & Pipelines", text: "Data workflows and pipelines that organize operational information for reporting, automation, and decision-making." },
  { title: "Power BI Dashboards", text: "Leadership-ready dashboards that turn scattered data into clear metrics, trends, and decisions." },
  { title: "Power Apps & SharePoint Systems", text: "Structured apps, lists, libraries, forms, and permissions built around real business processes." },
  { title: "Automation Workflows", text: "Power Automate flows that reduce manual routing, reminders, status updates, and repetitive admin work." }
];

const charoProducts = [
  { id: "studio-flare-hoodie", name: "Studio Flare Hoodie", price: 148, color: "Washed Black", status: "Limited", image: "/charostudios-assets/studio-flare-hoodie.png", alt: "Washed black oversized hoodie with distressed seams and abstract chest artwork.", sizes: ["S", "M", "L", "XL"] },
  { id: "painted-work-pant", name: "Painted Work Pant", price: 186, color: "Vintage Grey", status: "Limited", image: "/charostudios-assets/painted-work-pant.png", alt: "Distressed vintage grey work pant with paint splatter and raw hems.", sizes: ["30", "32", "34", "36"] },
  { id: "core-logo-tee", name: "Core Logo Tee", price: 64, color: "Bone", status: "Low stock", image: "/charostudios-assets/core-logo-tee.png", alt: "Bone oversized tee with a small black and red abstract chest emblem.", sizes: ["S", "M", "L", "XL"] },
  { id: "numbered-trucker", name: "Numbered Trucker", price: 48, color: "Faded Black", status: "Limited", image: "/charostudios-assets/numbered-trucker.png", alt: "Faded black trucker cap with worn brim and small embroidered abstract mark.", sizes: ["OS"] }
];

const initialCharoCart = [
  { productId: "studio-flare-hoodie", size: "L", quantity: 1 },
  { productId: "painted-work-pant", size: "32", quantity: 1 }
];

const formatStorePrice = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

function StoreIcon({ name, size = 18 }) {
  const shared = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" };
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    bag: <><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
    x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    minus: <path d="M5 12h14" />
  };

  return <svg {...shared}>{paths[name]}</svg>;
}

function CharoStudiosStorefront() {
  const [cartOpen, setCartOpen] = useState(() => (typeof window === "undefined" ? true : window.innerWidth >= 900));
  const [cartItems, setCartItems] = useState(initialCharoCart);
  const [selectedSizes, setSelectedSizes] = useState(Object.fromEntries(charoProducts.map((product) => [product.id, product.sizes[0]])));
  const [checkoutNotice, setCheckoutNotice] = useState(false);
  const checkoutUrl = import.meta.env.VITE_STRIPE_CHECKOUT_URL || "";
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => {
    const product = charoProducts.find((entry) => entry.id === item.productId);
    return total + (product?.price || 0) * item.quantity;
  }, 0);

  const addToCart = (productId) => {
    const size = selectedSizes[productId];
    setCartItems((current) => {
      const existing = current.find((item) => item.productId === productId && item.size === size);
      if (existing) {
        return current.map((item) => item.productId === productId && item.size === size ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, { productId, size, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const updateQuantity = (productId, size, change) => {
    setCartItems((current) =>
      current
        .map((item) => item.productId === productId && item.size === size ? { ...item, quantity: Math.max(0, item.quantity + change) } : item)
        .filter((item) => item.quantity > 0)
    );
  };

  const updateCartSize = (productId, previousSize, nextSize) => {
    setCartItems((current) =>
      current.map((item) => item.productId === productId && item.size === previousSize ? { ...item, size: nextSize } : item)
    );
  };

  const handleCheckout = (event) => {
    if (checkoutUrl) return;
    event.preventDefault();
    setCheckoutNotice(true);
  };

  return (
    <main className="cs-store-shell">
      <div className="cs-announcement"><span>First drop opens Friday 8PM CT</span><button type="button" aria-label="Dismiss announcement"><StoreIcon name="x" size={16} /></button></div>
      <header className="cs-header">
        <a href="/charostudios" className="cs-wordmark" aria-label="Charo Studios home">Charo Studios</a>
        <nav aria-label="Charo Studios navigation"><a href="#drop">Drop</a><a href="#lookbook">Lookbook</a><a href="#archive">Archive</a><a href="mailto:studio@elijahcharo.com">Support</a></nav>
        <div className="cs-header-actions"><button type="button" className="cs-icon-button" aria-label="Open menu"><StoreIcon name="menu" /></button><button type="button" className="cs-cart-button" onClick={() => setCartOpen(true)}><span>Cart ({cartCount})</span><StoreIcon name="bag" /></button></div>
      </header>

      <section className="cs-hero" id="top">
        <div className="cs-hero-copy">
          <h1>Cut,<br />distressed,<br />numbered</h1>
          <p>Garments built through process. Every piece is cut, treated, and finished in limited numbers.</p>
          <div className="cs-hero-actions"><a href="#drop" className="cs-primary-action">Shop the drop <StoreIcon name="arrow" /></a><button type="button" className="cs-secondary-action" onClick={() => setCartOpen(true)}>View cart <StoreIcon name="bag" /></button></div>
        </div>
        <div className="cs-hero-editorial" aria-label="Charo Studios garment study">
          <img src="/charostudios-assets/studio-flare-hoodie.png" alt="" />
          <div className="cs-hero-edition"><span>Drop 01</span><strong>Numbered run</strong></div>
        </div>
      </section>

      <section className="cs-product-drop" id="drop">
        <div className="cs-section-row"><h2>First Drop</h2><a href="#archive">View all <StoreIcon name="arrow" size={16} /></a></div>
        <div className="cs-product-grid">
          {charoProducts.map((product) => (
            <article className="cs-product-card" key={product.id}>
              <a className="cs-product-media" href={`#${product.id}`}><img src={product.image} alt={product.alt} /></a>
              <div className="cs-product-info" id={product.id}><div><h3>{product.name}</h3><p>{product.color}</p></div><strong>{formatStorePrice(product.price)}</strong></div>
              <div className="cs-product-controls">
                <label><span>Size</span><select value={selectedSizes[product.id]} onChange={(event) => setSelectedSizes((current) => ({ ...current, [product.id]: event.target.value }))}>{product.sizes.map((size) => <option value={size} key={size}>{size}</option>)}</select></label>
                <button type="button" onClick={() => addToCart(product.id)}><StoreIcon name="plus" size={17} />Add</button>
              </div>
              <span className="cs-product-status">{product.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="cs-lookbook" id="lookbook">
        <div className="cs-lookbook-image cs-lookbook-image-large"><img src="/charostudios-assets/painted-work-pant.png" alt="Painted work pant closeup on concrete." /></div>
        <div className="cs-lookbook-copy"><h2>Studio wear for late nights and loud rooms</h2><p>Heavy blanks, washed surfaces, and hand-finished distressing built for a first run that feels collected instead of stocked.</p><a href="#drop">Return to drop <StoreIcon name="arrow" size={17} /></a></div>
        <div className="cs-lookbook-image"><img src="/charostudios-assets/core-logo-tee.png" alt="Bone tee with small abstract chest emblem." /></div>
      </section>

      <footer className="cs-footer" id="archive"><span>Charo Studios</span><div><a href="/">Elijahcharo.com</a><a href="mailto:studio@elijahcharo.com">Email</a></div></footer>

      <aside className={`cs-cart-drawer${cartOpen ? " is-open" : ""}`} aria-label="Shopping cart">
        <div className="cs-cart-header"><h2>Your Cart ({cartCount})</h2><button type="button" className="cs-icon-button" onClick={() => setCartOpen(false)} aria-label="Close cart"><StoreIcon name="x" /></button></div>
        <div className="cs-cart-items">
          {cartItems.map((item) => {
            const product = charoProducts.find((entry) => entry.id === item.productId);
            if (!product) return null;
            return (
              <article className="cs-cart-item" key={`${item.productId}-${item.size}`}>
                <img src={product.image} alt="" />
                <div className="cs-cart-copy"><div><h3>{product.name}</h3><p>{product.color}</p></div><div className="cs-cart-controls"><label><span>Size</span><select value={item.size} onChange={(event) => updateCartSize(product.id, item.size, event.target.value)}>{product.sizes.map((size) => <option value={size} key={size}>{size}</option>)}</select></label><div className="cs-quantity" aria-label={`${product.name} quantity`}><button type="button" onClick={() => updateQuantity(product.id, item.size, -1)} aria-label={`Remove one ${product.name}`}><StoreIcon name="minus" size={15} /></button><span>{item.quantity}</span><button type="button" onClick={() => updateQuantity(product.id, item.size, 1)} aria-label={`Add one ${product.name}`}><StoreIcon name="plus" size={15} /></button></div></div></div>
                <strong>{formatStorePrice(product.price * item.quantity)}</strong>
              </article>
            );
          })}
        </div>
        <div className="cs-cart-summary"><div><span>Subtotal</span><strong>{formatStorePrice(subtotal)}</strong></div><p>Shipping and taxes calculated at checkout.</p><a className="cs-checkout-button" href={checkoutUrl || "#checkout"} target={checkoutUrl ? "_blank" : undefined} rel={checkoutUrl ? "noreferrer" : undefined} onClick={handleCheckout}><StoreIcon name="lock" />Checkout securely</a>{checkoutNotice ? <p className="cs-checkout-notice">Add a Stripe Payment Link or Checkout Session URL as VITE_STRIPE_CHECKOUT_URL.</p> : null}</div>
      </aside>
    </main>
  );
}

function PortfolioHome() {
  const [activeProject, setActiveProject] = useState("tasker");

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans overflow-hidden">
      <section className="relative flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:min-h-screen lg:py-16">
        <div className="absolute inset-x-0 top-0 h-[420px] sm:h-[520px] overflow-hidden">
          <video autoPlay muted loop playsInline className="h-full w-full object-cover opacity-35 sm:opacity-45 scale-105"><source src="/futuristic-banner.mp4" type="video/mp4" /></video>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/75 to-slate-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950/80" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_38%)]" />

        <div className="relative z-10 w-full max-w-7xl grid gap-5 sm:gap-6 lg:grid-cols-[1.35fr_0.9fr] lg:gap-12 lg:items-center">
          <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 sm:p-6 md:p-8 backdrop-blur-xl shadow-2xl">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-2 text-xs sm:text-sm text-blue-200 mb-4 sm:mb-5"><span className="h-2 w-2 shrink-0 rounded-full bg-blue-400 animate-pulse" /><span className="truncate">San Antonio · Data Engineering · Automation · Analytics</span></div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight lg:leading-[0.98]">I build systems that turn <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-200 to-blue-500">manual work into momentum.</span></h1>
            <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-slate-300 max-w-3xl leading-relaxed">I’m Elijah Charo - a Data Engineer in the U.S. Air Force focused on data engineering, automation, analytics, and digital operations. I build data pipelines, Power BI dashboards, Power Apps solutions, SharePoint systems, and automated workflows that help teams move from manual tracking to faster, smarter decision-making.</p>
            <div className="mt-6 sm:mt-7 grid gap-3 sm:flex sm:flex-wrap sm:gap-4"><a href="mailto:elijahcharo285@gmail.com" className="w-full sm:w-auto text-center rounded-full bg-blue-500 px-5 py-3 text-sm sm:text-base font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.28)] hover:bg-blue-400 transition">Let’s Build Something</a><a href="/ElijahCharo_Data_Engineering_Resume.pdf" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto text-center rounded-full border border-slate-600 px-5 py-3 text-sm sm:text-base font-semibold text-slate-100 hover:border-blue-400 hover:text-blue-300 transition">Download Resume</a></div>
            <div className="mt-6 sm:mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl"><div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-2xl sm:text-3xl font-bold text-blue-300">300+</p><p className="text-xs sm:text-sm text-slate-400">SharePoint sites supported</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-2xl sm:text-3xl font-bold text-blue-300">TS/SCI</p><p className="text-xs sm:text-sm text-slate-400">Clearance</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-2xl sm:text-3xl font-bold text-blue-300">40K+</p><p className="text-xs sm:text-sm text-slate-400">Personnel-supported environment</p></div></div>
          </section>

          <aside className="relative"><div className="absolute -inset-3 rounded-3xl bg-blue-500/20 blur-3xl" /><div className="relative rounded-3xl border border-white/10 bg-slate-950/70 p-5 sm:p-7 lg:p-8 backdrop-blur-xl shadow-2xl"><div className="flex flex-col items-center text-center"><img src="/elijah-charo-power-bi-sharepoint-automation-specialist-san-antonio.jpg" alt="Elijah Charo - Data Engineer, Power BI, SharePoint, and Automation Specialist in San Antonio" width="112" height="112" loading="eager" className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover object-top border-2 border-blue-400 shadow-[0_0_18px_rgba(96,165,250,0.40)]" /><h2 className="mt-4 sm:mt-5 text-2xl sm:text-3xl font-bold">Elijah Charo</h2><p className="mt-2 text-sm sm:text-base text-blue-200">Data Engineer | Automation & Operations</p><p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-400 leading-relaxed">Data Engineering · Power BI · Power Apps · Power Automate · SharePoint · Microsoft 365 · Analytics · Operations Modernization</p><a href="https://www.linkedin.com/in/elijah-charo-255889207" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center justify-center rounded-full border border-blue-400/40 bg-blue-500/10 px-5 py-2 text-sm font-semibold text-blue-200 hover:border-blue-300 hover:bg-blue-500/20 hover:text-white transition">View LinkedIn</a></div><div className="mt-6 sm:mt-8 grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">{skills.map((skill) => <div key={skill} className="rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs sm:text-sm text-slate-200">{skill}</div>)}</div></div></aside>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-14 sm:py-20 bg-slate-950"><div className="max-w-6xl mx-auto"><div className="max-w-3xl"><p className="text-blue-300 font-semibold">What I Build</p><h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">Digital solutions for teams buried in manual processes.</h2><p className="mt-4 sm:mt-5 text-slate-400 text-base sm:text-lg leading-relaxed">My focus is simple: replace scattered spreadsheets, inbox chaos, and repetitive status tracking with data pipelines, dashboards, apps, and Microsoft-based systems that are easier to manage and easier to measure.</p></div><div className="mt-8 sm:mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-5">{services.map((service) => <article key={service.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 hover:border-blue-400/50 hover:bg-blue-400/[0.04] transition"><h3 className="text-lg sm:text-xl font-bold text-white">{service.title}</h3><p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">{service.text}</p></article>)}</div></div></section>

      <section className="px-4 sm:px-6 py-14 sm:py-20 bg-slate-900/50"><div className="max-w-6xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-10 items-start"><div><p className="text-blue-300 font-semibold">Featured Work</p><h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">Projects with operational purpose.</h2><p className="mt-4 sm:mt-5 text-slate-400 text-base sm:text-lg leading-relaxed">These examples show the type of work I build: dashboards, automations, and structured systems that help organizations understand work, route work, and reduce manual follow-up.</p><div className="mt-6 sm:mt-8 flex flex-col gap-3">{Object.keys(projects).map((key) => <button key={key} onClick={() => setActiveProject(key)} className={`text-left rounded-2xl border p-4 sm:p-5 transition ${activeProject === key ? "border-blue-400 bg-blue-500/10" : "border-white/10 bg-white/[0.03] hover:border-blue-400/40"}`}><p className="text-xs sm:text-sm text-blue-300">{projects[key].tag}</p><h3 className="mt-1 text-lg sm:text-xl font-bold">{projects[key].title}</h3></button>)}</div></div><article className="rounded-3xl border border-blue-400/30 bg-slate-950 p-5 sm:p-8 shadow-[0_0_40px_rgba(59,130,246,0.12)]"><div className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-400/10 border border-white/10 p-5 sm:p-6"><p className="text-sm text-blue-200">{projects[activeProject].tag}</p><h3 className="mt-3 text-2xl sm:text-3xl font-black">{projects[activeProject].title}</h3><p className="mt-4 sm:mt-5 text-sm sm:text-base text-slate-300 leading-relaxed">{projects[activeProject].description}</p></div><div className="mt-5 sm:mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"><p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-blue-300">Value</p><p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">{projects[activeProject].impact}</p></div><div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center"><div className="rounded-xl bg-white/[0.04] p-4"><p className="text-xl sm:text-2xl font-bold text-blue-300">Track</p><p className="text-xs text-slate-500 mt-1">status</p></div><div className="rounded-xl bg-white/[0.04] p-4"><p className="text-xl sm:text-2xl font-bold text-blue-300">Route</p><p className="text-xs text-slate-500 mt-1">work</p></div><div className="rounded-xl bg-white/[0.04] p-4"><p className="text-xl sm:text-2xl font-bold text-blue-300">Report</p><p className="text-xs text-slate-500 mt-1">metrics</p></div></div></article></div></section>
      <section className="px-4 sm:px-6 py-14 sm:py-20 bg-slate-950"><div className="max-w-6xl mx-auto rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-slate-900 p-5 sm:p-8 md:p-12"><div className="grid lg:grid-cols-[1fr_0.8fr] gap-6 sm:gap-8 items-center"><div><p className="text-blue-300 font-semibold">Why It Matters</p><h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">I understand the gap between operations and technology.</h2><p className="mt-4 sm:mt-5 text-slate-300 text-base sm:text-lg leading-relaxed">A lot of teams do not need flashy software. They need someone who understands the data, the process, the people, the reporting requirements, and the pain of doing everything manually. That’s where I bring value.</p></div><div className="space-y-3 sm:space-y-4">{["Built around real operational workflows", "Data engineering and automation mindset", "Microsoft 365 and analytics experience", "Clear communication for technical and non-technical users"].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm sm:text-base text-slate-200">✓ {item}</div>)}</div></div></div></section>
      <section className="px-4 sm:px-6 py-14 sm:py-20 bg-slate-900/50"><div className="max-w-4xl mx-auto text-center"><p className="text-blue-300 font-semibold">Let’s Connect</p><h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">Need a dashboard, workflow, data pipeline, or internal system cleaned up?</h2><p className="mt-4 sm:mt-5 text-slate-400 text-base sm:text-lg leading-relaxed">I’m building solutions around data engineering, Power BI, Power Apps, SharePoint, Power Automate, Microsoft 365, and data operations - with a focus on practical automation that helps teams actually work better.</p><div className="mt-8 grid gap-3 sm:flex sm:flex-wrap sm:justify-center sm:gap-4"><a href="mailto:elijahcharo285@gmail.com" className="w-full sm:w-auto rounded-full bg-blue-500 px-7 py-3 font-semibold text-white shadow-[0_0_30px_rgba(59,130,246,0.35)] hover:bg-blue-400 transition">Email Me</a><a href="https://www.linkedin.com/in/elijah-charo-255889207" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto rounded-full border border-slate-600 px-7 py-3 font-semibold text-slate-100 hover:border-blue-400 hover:text-blue-300 transition">LinkedIn</a></div></div></section>
      <footer className="px-4 sm:px-6 py-8 border-t border-white/10 bg-slate-950 text-center text-xs sm:text-sm text-slate-500">© {new Date().getFullYear()} Elijah Charo. Built with React, Vite, Tailwind CSS, and data automation energy.</footer>
    </main>
  );
}

export default function ElijahCharoPortfolio() {
  const isCharoRoute = typeof window !== "undefined" && window.location.pathname.replace(/\/+$/, "") === "/charostudios";
  useEffect(() => {
    document.title = isCharoRoute ? "Charo Studios Drop | Elijah Charo" : "Elijah Charo | Data Engineer & Automation Specialist";
  }, [isCharoRoute]);

  return isCharoRoute ? <CharoStudiosStorefront /> : <PortfolioHome />;
}
