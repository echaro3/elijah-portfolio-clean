import React, { useState } from "react";

export default function ElijahCharoPortfolio() {
  const [activeProject, setActiveProject] = useState(null);

  const projectDescriptions = {
    tasker: {
      title: "Tasker Ops Dashboard (Power BI)",
      content:
        "An interactive Power BI dashboard that tracks task status, priorities, and overdue metrics. Built using mock SharePoint task data with slicers, visuals, and KPIs."
    },
    sharepoint: {
      title: "SharePoint Automation Suite",
      content:
        "Workflow automation examples using Power Automate and SharePoint Designer to route documents, send notifications, and manage task lifecycles."
    },
    knowledge: {
      title: "Knowledge Practices / FOIA / Records Management",
      content:
        "Experienced in Knowledge Management practices, FOIA/508 compliance documentation, and shared-drive governance."
    }
  };

  return (
    <>
      {/* Video banner */}
      <div className="relative w-full h-40 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/futuristic-banner.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <main className="transition-colors duration-300 bg-white text-black dark:bg-gray-950 dark:text-white min-h-screen font-sans">
        {/* Centered Header */}
        <header className="sticky top-0 z-50 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 text-center">
          <div className="p-6 flex flex-col items-center">
            <h1 className="text-3xl font-bold text-black dark:text-white">Elijah Charo</h1>
            <p className="text-gray-400 dark:text-gray-300 mt-1">
              Data & Automation Specialist | SharePoint | Power BI | TS Clearance
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-4">
              <a
                href="https://www.linkedin.com/in/elijah-charo-255889207"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                LinkedIn
              </a>
              <a
                href="/elijah-charo-resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                download
                className="text-blue-400 hover:underline"
              >
                Download Resume
              </a>
              <button
                onClick={() => document.documentElement.classList.toggle("dark")}
                className="px-3 py-1 text-sm bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded hover:ring hover:ring-blue-400"
              >
                Toggle Theme
              </button>
            </div>
          </div>
        </header>

        {/* About Me */}
        <section className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-semibold mb-2">About Me</h2>
          <p className="text-gray-800 dark:text-gray-300 max-w-3xl">
            I’m an IT and Data Operations professional with hands-on experience
            across Microsoft 365 solutions, Power BI, SharePoint, and Power
            Automate. I enjoy building streamlined workflows, dashboards, and
            digital solutions that make complex operations easier to manage.
          </p>
        </section>

        {/* Projects */}
        <section className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-semibold mb-4">Projects</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <button
              onClick={() => setActiveProject("tasker")}
              className="
                bg-white border border-gray-200 dark:bg-gray-900 dark:border-transparent
                p-6 rounded-xl
                hover:shadow-[0_0_15px_rgba(0,153,255,0.5)] 
                dark:hover:shadow-[0_0_15px_rgba(0,153,255,0.7)] 
                transition
              "
            >
              Tasker Ops Dashboard
            </button>
            <button
              onClick={() => setActiveProject("sharepoint")}
              className="
                bg-white border border-gray-200 dark:bg-gray-900 dark:border-transparent
                p-6 rounded-xl
                hover:shadow-[0_0_15px_rgba(0,153,255,0.5)] 
                dark:hover:shadow-[0_0_15px_rgba(0,153,255,0.7)] 
                transition
              "
            >
              SharePoint Automation
            </button>
            <button
              onClick={() => setActiveProject("knowledge")}
              className="
                bg-white border border-gray-200 dark:bg-gray-900 dark:border-transparent
                p-6 rounded-xl
                hover:shadow-[0_0_15px_rgba(0,153,255,0.5)] 
                dark:hover:shadow-[0_0_15px_rgba(0,153,255,0.7)] 
                transition
              "
            >
              Knowledge & Records
            </button>
          </div>

          {/* Dynamic project description */}
          {activeProject && (
            <div className="mt-6 bg-white/70 dark:bg-white/5 backdrop-blur-md p-6 border border-blue-500 rounded-lg transition-all">
              <h3 className="text-xl font-bold text-blue-400 mb-2">
                {projectDescriptions[activeProject].title}
              </h3>
              <p className="text-gray-800 dark:text-gray-300">
                {projectDescriptions[activeProject].content}
              </p>
            </div>
          )}
        </section>

        {/* Certifications */}
        <section className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-semibold mb-2">Certifications</h2>
          <ul className="list-disc list-inside text-gray-800 dark:text-gray-300 max-w-3xl">
            <li>PL-300: Microsoft Power BI Data Analyst Associate (In Progress)</li>
            <li>CompTIA Security+ (Planned)</li>
            <li>Top Secret (TS) Clearance – Active</li>
          </ul>
        </section>

        {/* Contact */}
        <section className="p-6">
          <h2 className="text-2xl font-semibold mb-2">Contact</h2>
          <p className="text-gray-800 dark:text-gray-300 max-w-3xl">
            Let’s connect!
          </p>
          <ul className="space-y-1 mt-2">
            <li>
              <a
                href="https://www.linkedin.com/in/elijah-charo-255889207"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href="mailto:elijahcharo285@gmail.com"
                className="text-blue-400 hover:underline"
              >
                elijahcharo285@gmail.com
              </a>
            </li>
          </ul>
        </section>

        {/* Footer */}
        <footer className="p-4 text-center text-sm text-gray-400 dark:text-gray-500">
          © {new Date().getFullYear()} Elijah Charo. Built with React, Vite & Tailwind CSS.
        </footer>
      </main>
    </>
  );
}
