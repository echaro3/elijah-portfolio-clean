import React, { useEffect } from "react";
import { CharoStudiosExperience } from "./CharoStudios.jsx";
import PortfolioHome from "./PortfolioHome.jsx";

export default function ElijahCharoPortfolio() {
  const currentPath = typeof window !== "undefined" ? window.location.pathname.replace(/\/+$/, "") || "/" : "/";
  const isCharoRoute = currentPath === "/charostudios" || currentPath.startsWith("/charostudios/");

  useEffect(() => {
    document.title = isCharoRoute ? "Charo Studios | Digital Design, Streetwear, Culture" : "Elijah Charo | Data Engineer & Automation Specialist";
  }, [isCharoRoute]);

  return isCharoRoute ? <CharoStudiosExperience path={currentPath} /> : <PortfolioHome />;
}
