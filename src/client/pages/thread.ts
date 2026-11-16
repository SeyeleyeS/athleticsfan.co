import { api } from "../api";
import { bootShell, setStatus, wireReports } from "../ui";

void bootShell();
wireReports();

const form = document.getElementById("reply-form");
const article = document.querySelector("[data-thread-id]");
if (form instanceof HTMLFormElement && article instanceof HTMLElement) {
  const id = article.dataset.threadId;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const button = form.querySelector("button");
    if (button instanceof HTMLButtonElement) button.disabled = true;
    try {
      await api(`/api/threads/${id}/replies`, {
        method: "POST",
        body: { body: String(data.get("body") || "") },
      });
      location.reload();
    } catch (error) {
      if (button instanceof HTMLButtonElement) button.disabled = false;
      setStatus("reply-status", error instanceof Error ? error.message : "Could not reply.");
    }
  });
}
