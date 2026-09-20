import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowDownToLine, ArrowUpRight, Braces, ChartNoAxesCombined, Check, Database, FolderKanban, GitBranch, Layers3, Mail, Menu, Moon, Sun, Workflow, X } from "lucide-react";
import DataRoutes from "./components/DataRoutes.jsx";
import "./Portfolio.css";

const resume = "/ElijahCharo_Resume_PowerPlatform.pdf";
const linkedIn = "https://www.linkedin.com/in/elijah-charo-255889207";
const email = "mailto:elijahcharo285@gmail.com";
const themeStorageKey = "elijah-portfolio-theme";

function readTheme() {
  try {
    return window.localStorage.getItem(themeStorageKey) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

const projects = [
  {
    id: "tasker", title: "Tasker Operations Dashboard", tag: "Power BI / SharePoint",
    description: "Interactive reporting for task status, suspense tracking, overdue items, and leadership visibility.",
    impact: "Designed to replace scattered manual tracking with centralized performance insights and operational decision support.",
    inputs: ["Task records", "Due dates", "Team ownership"], process: "Reporting model", outputs: ["Status visibility", "Overdue tracking", "Leadership reporting"], icon: ChartNoAxesCombined,
  },
  {
    id: "sharepoint", title: "SharePoint Automation Suite", tag: "Power Automate / Microsoft 365",
    description: "Workflow automation patterns for routing documents, sending notifications, managing approvals, and tracking lifecycle status.",
    impact: "Reduces repetitive admin work while preserving accountability, visibility, and process consistency.",
    inputs: ["Documents", "Requests", "Business rules"], process: "Approval workflow", outputs: ["Document routing", "Notifications", "Status tracking"], icon: Workflow,
  },
  {
    id: "knowledge", title: "Knowledge & Records Management", tag: "Knowledge management / Governance",
    description: "Experience supporting knowledge management practices, FOIA/508 documentation, and shared-drive governance.",
    impact: "Bridges operational requirements with clean digital structure, documentation, and compliance-minded processes.",
    inputs: ["Shared records", "Policy requirements", "Team knowledge"], process: "Governance framework", outputs: ["Organized records", "Documentation", "Consistent access"], icon: FolderKanban,
  },
];

const services = [
  { icon: Database, title: "Data engineering", text: "Pipelines and data workflows that turn operational information into a reliable foundation for reporting.", tools: "Data pipelines / Data operations" },
  { icon: ChartNoAxesCombined, title: "Analytics & reporting", text: "Power BI dashboards that make metrics, trends, and decisions easier for leadership to understand.", tools: "Power BI / Operational analytics" },
  { icon: Layers3, title: "Apps & internal systems", text: "Apps, forms, lists, and permissions organized around the way your team actually works.", tools: "Power Apps / SharePoint" },
  { icon: GitBranch, title: "Workflow automation", text: "Connected workflows that handle routing, approvals, reminders, and repetitive administrative work.", tools: "Power Automate / Microsoft 365" },
];

function WorkflowDiagram({ project }) {
  const Icon = project.icon;
  return (
    <figure className="portfolio-diagram" aria-label={`${project.title}: illustrative workflow overview`}>
      <figcaption><span className="portfolio-mono">WORKFLOW OVERVIEW</span><Braces size={17} aria-hidden="true" /></figcaption>
      <div className="portfolio-flow" key={project.id}>
        <div className="portfolio-flow-column">
          <p className="portfolio-mono">01 / INPUT</p>
          {project.inputs.map((input) => <div className="portfolio-flow-item" key={input}><span className="portfolio-node" />{input}</div>)}
        </div>
        <div className="portfolio-flow-engine">
          <div className="portfolio-flow-connector"><span /></div>
          <Icon size={27} strokeWidth={1.4} aria-hidden="true" />
          <p>{project.process}</p>
          <span className="portfolio-mono">02 / PROCESS</span>
        </div>
        <div className="portfolio-flow-column portfolio-flow-output">
          <p className="portfolio-mono">03 / OUTPUT</p>
          {project.outputs.map((output) => <div className="portfolio-flow-item" key={output}><Check size={13} aria-hidden="true" />{output}</div>)}
        </div>
      </div>
      <div className="portfolio-diagram-footer"><span>{project.tag}</span><span className="portfolio-diagram-mark" aria-hidden="true">[ EC ]</span></div>
    </figure>
  );
}

export default function PortfolioHome() {
  const [activeProject, setActiveProject] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(readTheme);
  const rootRef = useRef(null);
  const tabsRef = useRef([]);
  const menuButtonRef = useRef(null);
  const project = projects[activeProject];

  useEffect(() => {
    try {
      window.localStorage.setItem(themeStorageKey, theme);
    } catch {
      // The switch still works when browser storage is unavailable.
    }
  }, [theme]);

  useEffect(() => {
    const html = document.documentElement;
    const previousScheme = html.style.colorScheme;
    const previousBackground = document.body.style.backgroundColor;
    const existingMeta = document.querySelector('meta[name="theme-color"]');
    const meta = existingMeta || document.createElement("meta");
    const previousColor = meta.getAttribute("content");
    const background = getComputedStyle(rootRef.current).getPropertyValue("--paper").trim();
    meta.name = "theme-color";
    meta.content = background;
    if (!existingMeta) document.head.appendChild(meta);
    html.style.colorScheme = theme;
    document.body.style.backgroundColor = background;
    return () => {
      html.style.colorScheme = previousScheme;
      document.body.style.backgroundColor = previousBackground;
      if (!existingMeta) meta.remove();
      else if (previousColor === null) meta.removeAttribute("content");
      else meta.content = previousColor;
    };
  }, [theme]);

  useEffect(() => {
    const syncTheme = (event) => {
      if (event.key === themeStorageKey || event.key === null) setTheme(readTheme());
    };
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-in-view", entry.isIntersecting);
        if (entry.isIntersecting) entry.target.classList.add("has-entered");
      });
    }, { threshold: 0.08 });
    rootRef.current.querySelectorAll("[data-reveal], .portfolio-diagram").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [activeProject]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [menuOpen]);

  function navigateTabs(event, index) {
    let next;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % projects.length;
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index - 1 + projects.length) % projects.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = projects.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    setActiveProject(next);
    tabsRef.current[next]?.focus();
  }

  return (
    <div className="portfolio" data-theme={theme} ref={rootRef}>
      <a className="portfolio-skip" href="#main-content">Skip to content</a>
      <header className="portfolio-header">
        <div className="portfolio-container portfolio-nav-row">
          <a href="#" className="portfolio-wordmark" aria-label="Elijah Charo, home"><span className="portfolio-brand-mark" aria-hidden="true">ec<span>.</span></span><span>Elijah Charo</span></a>
          <div className="portfolio-header-controls">
          <nav id="portfolio-navigation" className={menuOpen ? "is-open" : ""} aria-label="Main navigation">
            <a href="#expertise" onClick={() => setMenuOpen(false)}>Expertise</a>
            <a href="#work" onClick={() => setMenuOpen(false)}>Work</a>
            <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
            <a className="portfolio-nav-resume" href={resume} download>Resume <ArrowDownToLine size={15} aria-hidden="true" /></a>
          </nav>
          <button className="portfolio-icon-button portfolio-theme-toggle" type="button" role="switch" aria-label="Dark mode" aria-checked={theme === "dark"} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
          <button className="portfolio-icon-button portfolio-menu-button" type="button" aria-expanded={menuOpen} aria-controls="portfolio-navigation" aria-label={menuOpen ? "Close navigation" : "Open navigation"} ref={menuButtonRef} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="portfolio-hero" aria-labelledby="portfolio-title">
          <DataRoutes theme={theme} />
          <div className="portfolio-container portfolio-hero-content">
            <div className="portfolio-hero-meta portfolio-mono"><span>DATA ENGINEER & AUTOMATION SPECIALIST</span><span>SAN ANTONIO, TX</span></div>
            <div className="portfolio-hero-copy">
              <h1 id="portfolio-title">Elijah Charo<span>.</span></h1>
              <p className="portfolio-hero-role">Engineering better<br />ways to work.</p>
              <p className="portfolio-hero-description">Data pipelines, useful dashboards, and automation built around real operations. I bring a U.S. Air Force perspective to making complex work simpler.</p>
              <div className="portfolio-actions">
                <a className="portfolio-button portfolio-button-primary" href="#work">Explore my work <ArrowDown size={17} aria-hidden="true" /></a>
                <a className="portfolio-text-link" href={resume} download>Download resume <ArrowDownToLine size={17} aria-hidden="true" /></a>
              </div>
            </div>
            <div className="portfolio-hero-bottom">
              <a href="https://www.elijahcharo.com/transitionplanner/" className="portfolio-tool-link"><span className="portfolio-tool-tag portfolio-mono">PUBLIC TOOL</span><span>Veteran Transition & Income Calculator</span><ArrowUpRight size={17} aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        <div className="portfolio-credentials">
          <dl className="portfolio-container">
            <div><dt>300+</dt><dd>SharePoint sites supported</dd></div>
            <div><dt>TS/SCI</dt><dd>Security clearance</dd></div>
            <div><dt>40K+</dt><dd>Personnel-supported environment</dd></div>
          </dl>
        </div>

        <section className="portfolio-section" id="expertise" aria-labelledby="expertise-title">
          <div className="portfolio-container">
            <div className="portfolio-section-heading" data-reveal>
              <p className="portfolio-eyebrow"><span>01</span> What I build</p>
              <div className="portfolio-heading-row"><h2 id="expertise-title">Practical systems.<br />Less manual work.</h2><p>I connect the data, processes, and tools your team depends on, from the first record to the final report.</p></div>
            </div>
            <div className="portfolio-services">
              {services.map(({ icon: Icon, title, text, tools }, index) => <article key={title} data-reveal>
                <div className="portfolio-service-top"><Icon size={26} strokeWidth={1.4} aria-hidden="true" /><span className="portfolio-mono">0{index + 1}</span></div>
                <h3>{title}</h3><p>{text}</p><p className="portfolio-service-tools">{tools}</p>
              </article>)}
            </div>
          </div>
        </section>

        <section className="portfolio-section portfolio-work-section" id="work" aria-labelledby="work-title">
          <div className="portfolio-container">
            <div className="portfolio-section-heading" data-reveal><p className="portfolio-eyebrow"><span>02</span> Featured work</p><div className="portfolio-heading-row"><h2 id="work-title">Built for the<br />operational side.</h2><p>Dashboards, automations, and structured systems that bring clarity to the work behind the work.</p></div></div>
            <div className="portfolio-work-layout">
              <div className="portfolio-project-tabs" role="tablist" aria-label="Featured projects" aria-orientation="vertical">
                {projects.map((item, index) => <button key={item.id} ref={(element) => { tabsRef.current[index] = element; }} type="button" role="tab" id={`project-tab-${item.id}`} aria-controls={`project-panel-${item.id}`} aria-selected={activeProject === index} tabIndex={activeProject === index ? 0 : -1} onClick={() => setActiveProject(index)} onKeyDown={(event) => navigateTabs(event, index)}>
                  <span className="portfolio-project-number portfolio-mono">0{index + 1}</span><span><span className="portfolio-project-tag">{item.tag}</span><span className="portfolio-project-name">{item.title}</span></span><ArrowUpRight size={19} aria-hidden="true" />
                </button>)}
              </div>
              <div>
                {projects.map((item, index) => <article key={item.id} role="tabpanel" id={`project-panel-${item.id}`} aria-labelledby={`project-tab-${item.id}`} tabIndex={0} hidden={activeProject !== index} className="portfolio-project-panel">
                  {activeProject === index && <><WorkflowDiagram project={project} /><div className="portfolio-project-copy"><h3>{project.title}</h3><p>{project.description}</p><div className="portfolio-project-value"><span className="portfolio-mono">THE VALUE</span><p>{project.impact}</p></div></div></>}
                </article>)}
              </div>
            </div>
          </div>
        </section>

        <section className="portfolio-section" id="about" aria-labelledby="about-title">
          <div className="portfolio-container portfolio-about-layout">
            <figure className="portfolio-portrait" data-reveal><img src="/elijah-charo-power-bi-sharepoint-automation-specialist-san-antonio.jpg" alt="Elijah Charo in U.S. Air Force service dress" width="728" height="675" loading="lazy" /><figcaption><span>Elijah Charo</span><span>U.S. Air Force</span></figcaption></figure>
            <div data-reveal><p className="portfolio-eyebrow"><span>03</span> Why it matters</p><h2 id="about-title">Operations first.<br />Technology with purpose.</h2><p className="portfolio-about-intro">Good systems start with understanding the people who use them.</p><p className="portfolio-about-description">My work sits between operations and technology. I understand the reporting requirements, the handoffs, and the cost of doing everything manually. That perspective shapes how I build: clear structure, practical automation, and information people can act on.</p><ul className="portfolio-principles">
              <li><Check size={17} aria-hidden="true" />Built around real operational workflows</li>
              <li><Check size={17} aria-hidden="true" />Data engineering and automation mindset</li>
              <li><Check size={17} aria-hidden="true" />Microsoft 365 and analytics experience</li>
              <li><Check size={17} aria-hidden="true" />Clear communication, technical or not</li>
            </ul><a className="portfolio-text-link" href={linkedIn} target="_blank" rel="noopener noreferrer">More about my experience <ArrowUpRight size={17} aria-hidden="true" /></a></div>
          </div>
        </section>

        <section className="portfolio-contact-section" id="contact" aria-labelledby="contact-title">
          <div className="portfolio-container portfolio-contact-layout" data-reveal><div><p className="portfolio-eyebrow"><span>04</span> Let's connect</p><h2 id="contact-title">Have a process<br />worth improving?</h2><p>A dashboard, a data pipeline, or an internal system.<br className="portfolio-desktop-break" /> Let's talk about what your team needs.</p></div><div className="portfolio-contact-actions"><a href={email} className="portfolio-button portfolio-button-primary"><Mail size={18} aria-hidden="true" />Email me<ArrowUpRight size={18} aria-hidden="true" /></a><a href={linkedIn} target="_blank" rel="noopener noreferrer" className="portfolio-text-link">Connect on LinkedIn<ArrowUpRight size={17} aria-hidden="true" /></a></div></div>
        </section>
      </main>

      <footer className="portfolio-footer"><div className="portfolio-container"><a className="portfolio-wordmark" href="#" aria-label="Elijah Charo, back to top"><span className="portfolio-brand-mark" aria-hidden="true">ec<span>.</span></span><span>Elijah Charo</span></a><p>&copy; {new Date().getFullYear()} Elijah Charo</p><a href={resume} download className="portfolio-text-link">Resume <ArrowDownToLine size={15} aria-hidden="true" /></a></div></footer>
    </div>
  );
}
