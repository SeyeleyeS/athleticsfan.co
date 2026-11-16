import { api } from "../api";
import { authorNode, bootShell, fillProse, reportControl, setStatus } from "../ui";

type Shout = {
  id: string;
  kind: string;
  subject: string;
  body: string;
  createdAt: string;
  author: { username: string; isDemo: boolean };
};

void bootShell();
void loadShouts();

const form = document.getElementById("shout-form");
if (form instanceof HTMLFormElement) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    try {
      await api("/api/shoutouts", {
        method: "POST",
        body: {
          kind: String(data.get("kind") || ""),
          subject: String(data.get("subject") || ""),
          body: String(data.get("body") || ""),
        },
      });
      form.reset();
      setStatus("shout-status", "Posted.");
      await loadShouts();
    } catch (error) {
      setStatus("shout-status", error instanceof Error ? error.message : "Could not post.");
    }
  });
}

async function loadShouts(): Promise<void> {
  const list = document.getElementById("shout-list");
  if (!list) return;
  try {
    const data = await api<{ shoutouts: Shout[] }>("/api/shoutouts");
    list.replaceChildren();
    if (!data.shoutouts.length) {
      list.textContent = "No notes yet. Keep it civil.";
      return;
    }
    for (const shout of data.shoutouts) {
      const card = document.createElement("article");
      card.className = `shout shout-${shout.kind}`;
      const kind = document.createElement("p");
      kind.className = "kicker";
      kind.textContent = shout.kind === "callout" ? "Callout" : "Praise";
      const subject = document.createElement("h2");
      subject.textContent = shout.subject;
      const body = document.createElement("p");
      body.className = "prose";
      fillProse(body, shout.body);
      const meta = document.createElement("p");
      meta.className = "meta";
      meta.append(authorNode(shout.author.username, shout.author.isDemo));
      meta.append(` · ${shout.createdAt.slice(0, 10)}`);
      card.append(kind, subject, body, meta, reportControl("shoutout", shout.id));
      list.append(card);
    }
  } catch {
    list.textContent = "The board will load when the API is connected.";
  }
}
