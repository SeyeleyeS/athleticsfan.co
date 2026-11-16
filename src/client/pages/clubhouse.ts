import { api } from "../api";
import { authorNode, bootShell, setStatus } from "../ui";

type Thread = {
  id: string;
  title: string;
  replyCount: number;
  announcement: boolean;
  updatedAt: string;
  author: { username: string; isDemo: boolean };
};

void bootShell().then((user) => {
  const slug = document.querySelector("main")?.getAttribute("data-category");
  if (!slug) return;
  void loadThreads(slug);
  const form = document.getElementById("thread-form");
  if (!(form instanceof HTMLFormElement)) return;
  if (!user) {
    setStatus("thread-status", "Sign in to start a thread.");
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const button = form.querySelector("button");
    if (button instanceof HTMLButtonElement) button.disabled = true;
    try {
      const created = await api<{ id: string }>(`/api/categories/${slug}/threads`, {
        method: "POST",
        body: { title: String(data.get("title") || ""), body: String(data.get("body") || "") },
      });
      location.href = `/clubhouse/t/${created.id}`;
    } catch (error) {
      if (button instanceof HTMLButtonElement) button.disabled = false;
      setStatus("thread-status", error instanceof Error ? error.message : "Could not post.");
    }
  });
});

async function loadThreads(slug: string): Promise<void> {
  const list = document.getElementById("thread-list");
  if (!list) return;
  try {
    const data = await api<{ threads: Thread[] }>(`/api/categories/${slug}/threads`);
    list.replaceChildren();
    if (!data.threads.length) {
      list.textContent = "No threads yet. Be the first.";
      return;
    }
    const ul = document.createElement("ul");
    ul.className = "link-list";
    for (const thread of data.threads) {
      const li = document.createElement("li");
      if (thread.announcement) {
        const flag = document.createElement("span");
        flag.className = "flag";
        flag.textContent = "Announcement";
        li.append(flag);
      }
      const link = document.createElement("a");
      link.href = `/clubhouse/t/${thread.id}`;
      link.textContent = thread.title;
      const meta = document.createElement("p");
      meta.className = "meta";
      meta.append(authorNode(thread.author.username, thread.author.isDemo));
      meta.append(` · ${thread.replyCount} replies`);
      li.append(link, meta);
      ul.append(li);
    }
    list.append(ul);
  } catch {
    list.textContent = "Threads will load when the API is connected.";
  }
}
