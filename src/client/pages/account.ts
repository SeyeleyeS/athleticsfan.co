import { api } from "../api";
import { bootShell, setStatus } from "../ui";

void bootShell();

function wire(id: string, path: string): void {
  const form = document.getElementById(id);
  if (!(form instanceof HTMLFormElement)) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    try {
      await api(path, {
        method: "POST",
        body: { username: String(data.get("username") || ""), password: String(data.get("password") || "") },
      });
      location.href = "/clubhouse/";
    } catch (error) {
      setStatus(`${id}-status`, error instanceof Error ? error.message : "Could not sign in.");
    }
  });
}

wire("login-form", "/api/auth/login");
wire("register-form", "/api/auth/register");
