import React from "react";

export default function ElijahCharoPortfolio() {
  return (
    <main className="bg-gray-950 text-white min-h-screen font-sans">
      <header className="p-6 border-b border-gray-800">
        <h1 className="text-3xl font-bold">Elijah Charo</h1>
        <p className="text-gray-400">Data & Automation Specialist | SharePoint | Power BI | TS Clearance</p>
        <div className="mt-2 flex gap-4">
          <a href="https://www.linkedin.com/in/elijah-charo-255889207" target="_blank" className="text-blue-400 hover:underline">LinkedIn</a>
          <a href="/elijah-charo-resume.pdf" target="_blank" rel="noopener noreferrer" download>Download Resume</a>
        </div>
      </header>

      <section className="p-6 border-b border-gray-800">
        <h2 className="text-2xl font-semibold mb-2">About Me</h2>
        <p className="text-gray-300 max-w-3xl">
          I'm an IT and Data Operations professional with hands-on experience across Microsoft 365 solutions, Power BI, SharePoint, and Power Automate.
          I enjoy building streamlined workflows, dashboards, and digital solutions that make complex operations easier to manage.
        </p>
      </section>

      <section className="p-6 border-b border-gray-800">
        <h2 className="text-2xl font-semibold mb-4">Projects</h2>
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold">📊 Tasker Ops Dashboard (Power BI)</h3>
            <p className="text-gray-300">An interactive Power BI dashboard that tracks task status, priorities, and overdue metrics. Built using mock SharePoint task data with slicers, visuals, and KPIs.</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold">🛠 SharePoint Automation Suite</h3>
            <p className="text-gray-300">Workflow automation examples using Power Automate and SharePoint Designer to route documents, send notifications, and manage task lifecycles.</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold">🛡 FOIA Tracker (Coming Soon)</h3>
            <p className="text-gray-300 italic">A dashboard for monitoring FOIA requests, response times, and compliance metrics across an organization.</p>
          </div>
        </div>
      </section>

      <section className="p-6 border-b border-gray-800">
        <h2 className="text-2xl font-semibold mb-2">Certifications</h2>
        <ul className="list-disc list-inside text-gray-300">
          <li>PL-300: Microsoft Power BI Data Analyst Associate (In Progress)</li>
          <li>CompTIA Security+ (Planned)</li>
          <li>Top Secret (TS) Clearance – Active</li>
        </ul>
      </section>

      <section className="p-6">
        <h2 className="text-2xl font-semibold mb-2">Contact</h2>
        <p className="text-gray-300">Let’s connect!</p>
        <ul className="text-blue-400 space-y-1 mt-2">
          <li><a href="https://www.linkedin.com/in/elijah-charo-255889207" target="_blank" className="hover:underline">LinkedIn</a></li>
          <li><a href="mailto:elijahcharo285@gmail.com" className="hover:underline">elijahcharo285@gmail.com</a></li>
        </ul>
      </section>
    </main>
  );
}