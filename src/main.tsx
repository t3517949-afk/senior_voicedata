
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

const savedTheme = localStorage.getItem("lingxi-theme");
const initialTheme = savedTheme === "day" ? "day" : "night";
document.documentElement.setAttribute("data-theme", initialTheme);

createRoot(document.getElementById("root")!).render(<App />);
  
