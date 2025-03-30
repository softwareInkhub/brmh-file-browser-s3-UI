import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import icons from Remix Icon
const loadRemixIcon = async () => {
  const link = document.createElement("link");
  link.href = "https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css";
  link.rel = "stylesheet";
  document.head.appendChild(link);
};

// Load Inter font
const loadInterFont = async () => {
  const link = document.createElement("link");
  link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
};

// Load fonts and icons
loadRemixIcon();
loadInterFont();

createRoot(document.getElementById("root")!).render(<App />);
