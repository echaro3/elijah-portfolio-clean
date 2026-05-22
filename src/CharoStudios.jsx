import React, { useMemo, useState } from "react";

const checkoutUrl = import.meta.env.VITE_STRIPE_CHECKOUT_URL || "";

const liveDrop = {
  id: "the-alien",
  name: "Wemby Alien Tee",
  collection: "Limited Drop 001",
  price: 88,
  status: "222 units",
  color: "Washed black",
  image: "/charostudios-assets/wemby-alien-shirt-mockup.png",
  detailImage: "/charostudios-assets/wemby-alien-black-shirt.webp",
  backImage: "/charostudios-assets/wemby-alien-frequency.webp",
  logoImage: "/charostudios-assets/go-spurs-go-script.webp",
  sizes: ["S", "M", "L", "XL", "XXL"],
  fit: "Oversized heavyweight tee",
  story:
    "A washed black shirt built around alien frequency graphics, San Antonio skyline energy, and oversized sports mythology.",
  specs: ["7.5oz heavyweight washed cotton", "Oversized fit with dropped shoulder", "Premium DTF print", "Washed black body", "Large front graphic"],
};

const shopDrops = [
  liveDrop,
  {
    id: "court-mirage",
    name: "Alien Frequency Tee",
    collection: "Concept 002",
    price: 78,
    status: "Concept locked",
    color: "Washed black",
    image: "/charostudios-assets/wemby-alien-frequency-tee-mockup.png",
    sizes: ["S", "M", "L", "XL", "XXL"],
    fit: "Oversized graphic tee",
  },
  {
    id: "river-signal",
    name: "Wemby Minimal Shades Tee",
    collection: "Concept 003",
    price: 76,
    status: "Vote-to-drop",
    color: "Faded black",
    image: "/charostudios-assets/wemby-minimal-shades-tee-mockup.png",
    sizes: ["S", "M", "L", "XL"],
    fit: "Washed heavyweight tee",
  },
  {
    id: "sa-static",
    name: "Go Spurs Go Script Tee",
    collection: "Digital study",
    price: 72,
    status: "Unreleased",
    color: "Black",
    image: "/charostudios-assets/go-spurs-go-script-tee-mockup.png",
    sizes: ["S", "M", "L", "XL"],
    fit: "Boxy streetwear tee",
  },
  {
    id: "underground-concept",
    name: "Archive Signal Tee",
    collection: "Studio sample",
    price: 80,
    status: "Sample only",
    color: "Washed black",
    image: "/charostudios-assets/wemby-alien-frequency-tee-mockup.png",
    sizes: ["M", "L", "XL"],
    fit: "Heavy oversized tee",
  },
];

const archiveDrops = [
  { name: "Wemby Alien Tee", season: "Drop 001", status: "Active sample", image: "/charostudios-assets/wemby-alien-shirt-mockup.png" },
  { name: "Alien Frequency Tee", season: "Concept 002", status: "Unreleased", image: "/charostudios-assets/wemby-alien-frequency-tee-mockup.png" },
  { name: "Wemby Minimal Shades Tee", season: "Concept 003", status: "Vote-to-drop", image: "/charostudios-assets/wemby-minimal-shades-tee-mockup.png" },
  { name: "Go Spurs Go Script Tee", season: "Concept 003", status: "Unreleased", image: "/charostudios-assets/go-spurs-go-script-tee-mockup.png" },
];

const conceptDrops = [
  { id: "signal", name: "Alien Frequency Tee", note: "Rendered on a washed black tee with skyline, orbital rings, and black/green glow.", image: "/charostudios-assets/wemby-alien-frequency-tee-mockup.png", votes: 42 },
  { id: "river", name: "Wemby Minimal Shades Tee", note: "Minimal portrait graphic on heavyweight washed black cotton.", image: "/charostudios-assets/wemby-minimal-shades-tee-mockup.png", votes: 35 },
  { id: "alien", name: "Wemby Alien Tee", note: "Current front-print direction on washed black cotton.", image: "/charostudios-assets/wemby-alien-shirt-mockup.png", votes: 51 },
  { id: "south", name: "Go Spurs Go Script Tee", note: "Script mark mocked on a black tee for sleeve, back neck, or alternate front placement.", image: "/charostudios-assets/go-spurs-go-script-tee-mockup.png", votes: 28 },
];

const navItems = [
  { href: "/charostudios/shop", label: "Shop" },
  { href: "/charostudios/drop/the-alien", label: "Drop 001" },
  { href: "/charostudios/concepts", label: "Concepts" },
  { href: "/charostudios/archive", label: "Archive" },
  { href: "/charostudios/about", label: "About" },
];

const formatPrice = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

function StudioIcon({ name, size = 18 }) {
  const shared = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };
  const paths = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    bag: (
      <>
        <path d="M6 8h12l-1 12H7L6 8Z" />
        <path d="M9 8a3 3 0 0 1 6 0" />
      </>
    ),
    close: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
  };

  return <svg {...shared}>{paths[name]}</svg>;
}

function routeName(path) {
  if (path.includes("/shop")) return "shop";
  if (path.includes("/drop/the-alien")) return "drop";
  if (path.includes("/archive")) return "archive";
  if (path.includes("/concepts")) return "concepts";
  if (path.includes("/about")) return "about";
  return "home";
}

function ProductVisual({ product, mode = "card" }) {
  if (product.image) {
    return <img src={product.image} alt={`${product.name} ${product.color} product mockup`} loading={mode === "hero" ? "eager" : "lazy"} />;
  }

  return (
    <div className={`cs-tee-visual is-${product.tone || "black"} is-${mode}`} aria-label={`${product.name} product concept`}>
      <div className="cs-tee-sleeve cs-tee-sleeve-left" />
      <div className="cs-tee-sleeve cs-tee-sleeve-right" />
      <div className="cs-tee-body">
        <span>{product.print}</span>
      </div>
    </div>
  );
}

function StudioHeader({ activeRoute, cartCount, onCartOpen }) {
  return (
    <header className="cs-site-header">
      <a href="/charostudios" className="cs-brand-mark" aria-label="Charo Studios home">
        <span>CHARO</span>
        <span>STUDIOS</span>
      </a>
      <nav className="cs-site-nav" aria-label="Charo Studios navigation">
        {navItems.map((item) => (
          <a className={activeRoute === routeName(item.href) ? "is-active" : ""} href={item.href} key={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
      <button type="button" className="cs-bag-button" onClick={onCartOpen}>
        <span>Cart ({cartCount})</span>
        <StudioIcon name="bag" />
      </button>
    </header>
  );
}

function HomePage({ onAdd }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((event.clientX - rect.left) / rect.width - 0.5) * 18,
      y: ((event.clientY - rect.top) / rect.height - 0.5) * -18,
    });
  };

  return (
    <>
      <section className="cs-cinematic-hero" onMouseMove={handleMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })}>
        <div className="cs-hero-copy-block">
          <p>LIMITED DROP 001</p>
          <h1>CHARO STUDIOS</h1>
          <span>Digital Design / Streetwear / Culture</span>
          <div className="cs-hero-actions-row">
            <a href="/charostudios/drop/the-alien" className="cs-button cs-button-primary">
              View the shirt <StudioIcon name="arrow" />
            </a>
            <a href="/charostudios/shop" className="cs-button cs-button-ghost">
              Shop drop
            </a>
          </div>
        </div>
        <a
          href="/charostudios/drop/the-alien"
          className="cs-hero-product"
          style={{ "--tilt-x": `${tilt.y}deg`, "--tilt-y": `${tilt.x}deg` }}
          aria-label="View Wemby Alien Tee"
        >
          <ProductVisual product={liveDrop} mode="hero" />
          <div className="cs-hero-product-label">
            <span>{liveDrop.name}</span>
            <strong>{formatPrice(liveDrop.price)}</strong>
          </div>
        </a>
      </section>

      <section className="cs-drop-strip">
        <div>
          <h2>Alien Frequency</h2>
          <p>Black cotton, toxic green glow, oversized statement graphics, and San Antonio sports mythology.</p>
        </div>
        <a href="/charostudios/concepts" className="cs-text-link">
          Vote on concepts <StudioIcon name="arrow" size={16} />
        </a>
      </section>

      <section className="cs-home-shop">
        <div className="cs-section-title-row">
          <h2>Shop Drop 001</h2>
          <a href="/charostudios/shop">All pieces</a>
        </div>
        <ProductGrid products={shopDrops} onAdd={onAdd} compact />
      </section>
    </>
  );
}

function ProductGrid({ products, onAdd, compact = false }) {
  const [selectedSizes, setSelectedSizes] = useState(() => Object.fromEntries(products.map((product) => [product.id, product.sizes?.[0] || "OS"])));

  return (
    <div className={`cs-product-grid-v2${compact ? " is-compact" : ""}`}>
      {products.map((product) => (
        <article className="cs-product-tile" key={product.id}>
          <a className="cs-product-visual-link" href={product.id === "the-alien" ? "/charostudios/drop/the-alien" : "/charostudios/shop"}>
            <ProductVisual product={product} />
          </a>
          <div className="cs-product-meta">
            <div>
              <p>{product.collection}</p>
              <h3>{product.name}</h3>
              <span>{product.fit}</span>
            </div>
            <strong>{formatPrice(product.price)}</strong>
          </div>
          <div className="cs-product-buy-row">
            <label>
              <span>Size</span>
              <select value={selectedSizes[product.id]} onChange={(event) => setSelectedSizes((current) => ({ ...current, [product.id]: event.target.value }))}>
                {(product.sizes || ["OS"]).map((size) => (
                  <option value={size} key={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={() => onAdd(product, selectedSizes[product.id])}>
              Add
            </button>
          </div>
          <span className="cs-limited-tag">{product.status}</span>
        </article>
      ))}
    </div>
  );
}

function ShopPage({ onAdd }) {
  return (
    <section className="cs-page-shell cs-shop-page">
      <div className="cs-page-intro">
        <p>SHOP</p>
        <h1>Drop grid.</h1>
        <span>Three to eight pieces max. If it is not strong enough to stand alone, it does not drop.</span>
      </div>
      <ProductGrid products={shopDrops} onAdd={onAdd} />
    </section>
  );
}

function DropPage({ onAdd }) {
  const [selectedSize, setSelectedSize] = useState(liveDrop.sizes[0]);

  return (
    <section className="cs-page-shell cs-drop-page">
      <div className="cs-drop-hero">
        <div className="cs-drop-title">
          <p>{liveDrop.collection}</p>
          <h1>{liveDrop.name}</h1>
          <span>{liveDrop.story}</span>
          <div className="cs-drop-buy-panel">
            <strong>{formatPrice(liveDrop.price)}</strong>
            <label>
              <span>Size</span>
              <select value={selectedSize} onChange={(event) => setSelectedSize(event.target.value)}>
                {liveDrop.sizes.map((size) => (
                  <option value={size} key={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="cs-button cs-button-primary" onClick={() => onAdd(liveDrop, selectedSize)}>
              Add to cart
            </button>
          </div>
        </div>
        <div className="cs-drop-mockups">
          <figure>
            <img src={liveDrop.image} alt="Wemby Alien Tee front mockup on black shirt" loading="eager" />
            <figcaption>Front mockup</figcaption>
          </figure>
          <figure className="cs-back-mock">
            <img src={liveDrop.backImage} alt="Alien Frequency back graphic concept" loading="lazy" />
            <figcaption>Back graphic study</figcaption>
          </figure>
        </div>
      </div>

      <div className="cs-detail-grid">
        <figure className="cs-detail-shot is-print">
          <img src={liveDrop.detailImage} alt="Close up of Wemby Alien graphic artwork" />
          <figcaption>Print detail</figcaption>
        </figure>
        <figure className="cs-detail-shot is-fit">
          <img src={liveDrop.logoImage} alt="Go Spurs Go script artwork" />
          <figcaption>Secondary mark</figcaption>
        </figure>
        <div className="cs-story-panel">
          <h2>Story</h2>
          <p>
            Charo Studios explores oversized graphics, surreal sports culture, and statement-driven streetwear inspired by San Antonio. The Wemby Alien Tee is the first artifact from that world: loud from far away, sharper when you get close.
          </p>
        </div>
      </div>

      <div className="cs-specs-layout">
        <section>
          <h2>Specs</h2>
          <ul>
            {liveDrop.specs.map((spec) => (
              <li key={spec}>{spec}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Sizing</h2>
          <table>
            <thead>
              <tr>
                <th>Size</th>
                <th>Chest</th>
                <th>Length</th>
                <th>Sleeve</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["S", "22", "27", "8.5"],
                ["M", "23", "28", "9"],
                ["L", "24.5", "29", "9.5"],
                ["XL", "26", "30", "10"],
                ["XXL", "27.5", "31", "10.5"],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => (
                    <td key={cell}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </section>
  );
}

function ArchivePage() {
  return (
    <section className="cs-page-shell">
      <div className="cs-page-intro">
        <p>ARCHIVE</p>
        <h1>Sold out still matters.</h1>
        <span>Past experiments stay visible. The archive gives every run a timestamp.</span>
      </div>
      <div className="cs-archive-grid">
        {archiveDrops.map((drop) => (
          <article key={drop.name}>
            <img src={drop.image} alt={`${drop.name} archive product`} />
            <div>
              <p>{drop.season}</p>
              <h2>{drop.name}</h2>
              <span>{drop.status}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ConceptsPage() {
  const [votes, setVotes] = useState(Object.fromEntries(conceptDrops.map((concept) => [concept.id, concept.votes])));

  return (
    <section className="cs-page-shell">
      <div className="cs-page-intro">
        <p>CONCEPTS</p>
        <h1>Studio experiments.</h1>
        <span>Unreleased graphics live here first. Vote on what should become the next physical drop.</span>
      </div>
      <div className="cs-concepts-grid">
        {conceptDrops.map((concept) => (
          <article key={concept.id}>
            <ProductVisual product={concept} />
            <div>
              <h2>{concept.name}</h2>
              <p>{concept.note}</p>
              <button type="button" onClick={() => setVotes((current) => ({ ...current, [concept.id]: current[concept.id] + 1 }))}>
                Vote ({votes[concept.id]})
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AboutPage() {
  return (
    <section className="cs-page-shell cs-about-page">
      <div>
        <p>ABOUT</p>
        <h1>CHARO STUDIOS</h1>
      </div>
      <p>
        Charo Studios explores oversized graphics, surreal sports culture, and statement-driven streetwear inspired by San Antonio.
      </p>
      <p>
        Digital design first. Physical drops when the concept earns it.
      </p>
    </section>
  );
}

function CartDrawer({ isOpen, items, onClose, onQuantityChange }) {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const [notice, setNotice] = useState(false);

  const handleCheckout = (event) => {
    if (checkoutUrl) return;
    event.preventDefault();
    setNotice(true);
  };

  return (
    <aside className={`cs-studio-cart${isOpen ? " is-open" : ""}`} aria-label="Shopping cart">
      <div className="cs-studio-cart-header">
        <h2>Cart</h2>
        <button type="button" aria-label="Close cart" onClick={onClose}>
          <StudioIcon name="close" />
        </button>
      </div>
      <div className="cs-studio-cart-list">
        {items.length === 0 ? <p className="cs-empty-cart">No pieces selected.</p> : null}
        {items.map((item) => (
          <article key={`${item.product.id}-${item.size}`} className="cs-studio-cart-item">
            <div className="cs-cart-thumb">
              <ProductVisual product={item.product} />
            </div>
            <div>
              <h3>{item.product.name}</h3>
              <p>{item.size} / {item.product.color}</p>
              <div className="cs-cart-qty">
                <button type="button" aria-label={`Remove one ${item.product.name}`} onClick={() => onQuantityChange(item.product.id, item.size, -1)}>
                  <StudioIcon name="minus" size={14} />
                </button>
                <span>{item.quantity}</span>
                <button type="button" aria-label={`Add one ${item.product.name}`} onClick={() => onQuantityChange(item.product.id, item.size, 1)}>
                  <StudioIcon name="plus" size={14} />
                </button>
              </div>
            </div>
            <strong>{formatPrice(item.product.price * item.quantity)}</strong>
          </article>
        ))}
      </div>
      <div className="cs-studio-cart-footer">
        <div>
          <span>Subtotal</span>
          <strong>{formatPrice(subtotal)}</strong>
        </div>
        <a href={checkoutUrl || "#checkout"} target={checkoutUrl ? "_blank" : undefined} rel={checkoutUrl ? "noreferrer" : undefined} onClick={handleCheckout}>
          <StudioIcon name="lock" />
          Checkout
        </a>
        {notice ? <p>Connect a Stripe Payment Link in Vercel as VITE_STRIPE_CHECKOUT_URL.</p> : null}
      </div>
    </aside>
  );
}

export function CharoStudiosExperience({ path }) {
  const activeRoute = routeName(path);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  const addToCart = (product, size = product.sizes?.[0] || "OS") => {
    setCartItems((current) => {
      const existing = current.find((item) => item.product.id === product.id && item.size === size);
      if (existing) {
        return current.map((item) => (item.product.id === product.id && item.size === size ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { product, size, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const updateQuantity = (productId, size, change) => {
    setCartItems((current) =>
      current
        .map((item) => (item.product.id === productId && item.size === size ? { ...item, quantity: Math.max(0, item.quantity + change) } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const content = {
    home: <HomePage onAdd={addToCart} />,
    shop: <ShopPage onAdd={addToCart} />,
    drop: <DropPage onAdd={addToCart} />,
    archive: <ArchivePage />,
    concepts: <ConceptsPage />,
    about: <AboutPage />,
  }[activeRoute];

  return (
    <main className="cs-store-shell cs-site">
      <StudioHeader activeRoute={activeRoute} cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />
      {content}
      <footer className="cs-site-footer">
        <span>CHARO STUDIOS</span>
        <div>
          <a href="/charostudios/shop">Shop</a>
          <a href="/charostudios/concepts">Concepts</a>
          <a href="/">Elijahcharo.com</a>
        </div>
      </footer>
      <CartDrawer isOpen={cartOpen} items={cartItems} onClose={() => setCartOpen(false)} onQuantityChange={updateQuantity} />
    </main>
  );
}
