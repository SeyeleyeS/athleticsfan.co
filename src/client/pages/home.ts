import { api } from "../api";
import { authorNode, bootShell, fillProse } from "../ui";

type Poll = {
  id: string;
  question: string;
  total: number;
  options: { id: string; label: string; votes: number }[];
};
type Shout = { id: string; kind: string; subject: string; body: string; author: { username: string; isDemo: boolean } };

void bootShell();

async function loadPoll(): Promise<void> {
  const slot = document.getElementById("live-poll");
  if (!slot) return;
  try {
    const data = await api<{ polls: Poll[] }>("/api/polls");
    const poll = data.polls[0];
    slot.replaceChildren();
    const heading = document.createElement("h2");
    heading.textContent = "Latest poll";
    slot.append(heading);
    if (!poll) {
      const empty = document.createElement("p");
      empty.textContent = "No polls yet. ";
      const link = document.createElement("a");
      link.href = "/polls/";
      link.textContent = "Open the board and start one.";
      empty.append(link);
      slot.append(empty);
      return;
    }
    const card = document.createElement("article");
    card.className = "poll-card";
    const title = document.createElement("h3");
    title.textContent = poll.question;
    card.append(title);
    for (const option of poll.options) {
      const row = document.createElement("div");
      row.className = "option";
      const label = document.createElement("span");
      const pct = poll.total ? Math.round((option.votes / poll.total) * 100) : 0;
      label.textContent = `${option.label} · ${option.votes} (${pct}%)`;
      const bar = document.createElement("div");
      bar.className = "bar";
      const fill = document.createElement("span");
      fill.style.width = `${pct}%`;
      bar.append(fill);
      row.append(label, bar);
      card.append(row);
    }
    const more = document.createElement("a");
    more.href = "/polls/";
    more.textContent = "All polls";
    card.append(more);
    slot.append(card);
  } catch {
    slot.textContent = "Polls will show here when the clubhouse API is connected.";
  }
}

async function loadShouts(): Promise<void> {
  const slot = document.getElementById("live-shoutouts");
  if (!slot) return;
  try {
    const data = await api<{ shoutouts: Shout[] }>("/api/shoutouts");
    slot.replaceChildren();
    const heading = document.createElement("h2");
    heading.textContent = "Callout or praise";
    slot.append(heading);
    if (!data.shoutouts.length) {
      const empty = document.createElement("p");
      empty.textContent = "The board is empty. ";
      const link = document.createElement("a");
      link.href = "/shoutouts/";
      link.textContent = "Leave a note.";
      empty.append(link);
      slot.append(empty);
      return;
    }
    for (const shout of data.shoutouts.slice(0, 3)) {
      const card = document.createElement("article");
      card.className = `shout shout-${shout.kind}`;
      const kind = document.createElement("p");
      kind.className = "kicker";
      kind.textContent = shout.kind;
      const subject = document.createElement("h3");
      subject.textContent = shout.subject;
      const body = document.createElement("p");
      body.className = "prose";
      fillProse(body, shout.body);
      const meta = document.createElement("p");
      meta.className = "meta";
      meta.append(authorNode(shout.author.username, shout.author.isDemo));
      card.append(kind, subject, body, meta);
      slot.append(card);
    }
    const more = document.createElement("p");
    const link = document.createElement("a");
    link.href = "/shoutouts/";
    link.textContent = "The full board";
    more.append(link);
    slot.append(more);
  } catch {
    slot.textContent = "Callouts will show here when the clubhouse API is connected.";
  }
}

void loadPoll();
void loadShouts();
