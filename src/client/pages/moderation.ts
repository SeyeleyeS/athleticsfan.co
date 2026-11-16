import { api, type PublicUser } from "../api";
import { bootShell, setStatus } from "../ui";

type Report = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: string;
};

void bootShell().then(async (user: PublicUser | null) => {
  const list = document.getElementById("mod-list");
  if (!list) return;
  if (!user || user.role !== "admin") {
    list.textContent = "Moderators only.";
    return;
  }
  try {
    const data = await api<{ reports: Report[] }>("/api/moderation/reports");
    list.replaceChildren();
    if (!data.reports.length) {
      list.textContent = "No reports.";
      return;
    }
    for (const report of data.reports) {
      const card = document.createElement("article");
      card.className = "card";
      const title = document.createElement("h2");
      title.textContent = `${report.targetType} · ${report.status}`;
      const meta = document.createElement("p");
      meta.className = "meta";
      meta.textContent = `${report.reporter} · ${report.createdAt.slice(0, 10)} · ${report.targetId}`;
      const reason = document.createElement("p");
      reason.textContent = report.reason;
      const hide = document.createElement("button");
      hide.type = "button";
      hide.textContent = "Hide";
      hide.addEventListener("click", async () => {
        await act(`/api/moderation/hide`, { targetType: report.targetType, targetId: report.targetId });
      });
      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "Delete";
      del.addEventListener("click", async () => {
        await api(`/api/moderation/${report.targetType}/${report.targetId}`, { method: "DELETE" });
        setStatus("mod-status", "Deleted.");
        location.reload();
      });
      const resolve = document.createElement("button");
      resolve.type = "button";
      resolve.textContent = "Resolve report";
      resolve.addEventListener("click", async () => {
        await api(`/api/moderation/reports/${report.id}/resolve`, { method: "POST" });
        location.reload();
      });
      card.append(title, meta, reason, hide, del, resolve);
      list.append(card);
    }
  } catch (error) {
    list.textContent = error instanceof Error ? error.message : "Could not load reports.";
  }
});

async function act(path: string, body: unknown): Promise<void> {
  await api(path, { method: "POST", body });
  setStatus("mod-status", "Updated.");
  location.reload();
}
