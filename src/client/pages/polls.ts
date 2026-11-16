import { api } from "../api";
import { authorNode, bootShell, reportControl, setStatus } from "../ui";

type Poll = {
  id: string;
  question: string;
  total: number;
  yourVote: string | null;
  author: { username: string; isDemo: boolean };
  options: { id: string; label: string; votes: number }[];
};

void bootShell();
void loadPolls();

const form = document.getElementById("poll-form");
if (form instanceof HTMLFormElement) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const options = String(data.get("options") || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    try {
      await api("/api/polls", {
        method: "POST",
        body: { question: String(data.get("question") || ""), options },
      });
      form.reset();
      setStatus("poll-status", "Poll posted.");
      await loadPolls();
    } catch (error) {
      setStatus("poll-status", error instanceof Error ? error.message : "Could not post the poll.");
    }
  });
}

async function loadPolls(): Promise<void> {
  const list = document.getElementById("poll-list");
  if (!list) return;
  try {
    const data = await api<{ polls: Poll[] }>("/api/polls");
    list.replaceChildren();
    if (!data.polls.length) {
      list.textContent = "No polls yet.";
      return;
    }
    for (const poll of data.polls) {
      const card = document.createElement("article");
      card.className = "poll-card";
      const title = document.createElement("h2");
      title.textContent = poll.question;
      const meta = document.createElement("p");
      meta.className = "meta";
      meta.append(authorNode(poll.author.username, poll.author.isDemo));
      card.append(title, meta);
      const results = document.createElement("div");
      results.setAttribute("aria-live", "polite");
      renderOptions(results, poll);
      card.append(results, reportControl("poll", poll.id));
      list.append(card);
    }
  } catch {
    list.textContent = "Polls will load when the API is connected.";
  }
}

function renderOptions(host: HTMLElement, poll: Poll): void {
  host.replaceChildren();
  for (const option of poll.options) {
    const row = document.createElement("div");
    row.className = "option";
    const pct = poll.total ? Math.round((option.votes / poll.total) * 100) : 0;
    const label = document.createElement("span");
    label.textContent = `${option.label} · ${option.votes} vote${option.votes === 1 ? "" : "s"} · ${pct}%`;
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.setAttribute("role", "img");
    bar.setAttribute("aria-label", `${option.label} ${pct} percent`);
    const fill = document.createElement("span");
    fill.style.width = `${pct}%`;
    bar.append(fill);
    row.append(label, bar);
    if (!poll.yourVote) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `Vote: ${option.label}`;
      button.addEventListener("click", async () => {
        button.disabled = true;
        try {
          const data = await api<{ poll: Poll }>(`/api/polls/${poll.id}/vote`, {
            method: "POST",
            body: { optionId: option.id },
          });
          renderOptions(host, data.poll);
        } catch (error) {
          button.disabled = false;
          label.textContent = error instanceof Error ? error.message : "Vote failed.";
        }
      });
      row.append(button);
    } else if (poll.yourVote === option.id) {
      const yours = document.createElement("span");
      yours.className = "flag";
      yours.textContent = "Your vote";
      row.append(yours);
    }
    host.append(row);
  }
}
