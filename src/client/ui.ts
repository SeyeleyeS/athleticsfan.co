import { api, type PublicUser } from "./api";

export function authorNode(username: string, isDemo: boolean): HTMLElement {
  const wrap = document.createElement("span");
  const name = document.createElement("span");
  name.className = "author";
  name.textContent = username;
  wrap.append(name);
  if (isDemo) {
    const badge = document.createElement("span");
    badge.className = "demo-badge";
    badge.textContent = "Demo account";
    wrap.append(badge);
  }
  return wrap;
}

export function fillProse(element: HTMLElement, text: string): void {
  element.replaceChildren();
  const pieces = text.split(/(https:\/\/[^\s]+)/g);
  for (const piece of pieces) {
    if (piece.startsWith("https://")) {
      const href = piece.replace(/[),.;!?]+$/g, "");
      const trailing = piece.slice(href.length);
      const link = document.createElement("a");
      link.href = href;
      link.rel = "ugc noopener";
      link.target = "_blank";
      link.textContent = href;
      element.append(link);
      if (trailing) element.append(trailing);
    } else if (piece) {
      element.append(piece);
    }
  }
}

export function reportControl(targetType: string, targetId: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "text-button";
  button.textContent = "Report";
  button.addEventListener("click", () => {
    if (button.nextElementSibling instanceof HTMLFormElement) return;
    const form = document.createElement("form");
    form.className = "report-form";
    const label = document.createElement("label");
    label.textContent = "Why are you reporting this?";
    const area = document.createElement("textarea");
    area.required = true;
    area.maxLength = 500;
    area.minLength = 8;
    label.append(area);
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Send report";
    const status = document.createElement("p");
    status.role = "alert";
    form.append(label, submit, status);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      submit.disabled = true;
      try {
        await api("/api/reports", {
          method: "POST",
          body: { targetType, targetId, reason: area.value },
        });
        status.textContent = "Report sent. A moderator can hide or delete it.";
      } catch (error) {
        submit.disabled = false;
        status.textContent = error instanceof Error ? error.message : "Could not send the report.";
      }
    });
    button.insertAdjacentElement("afterend", form);
  });
  return button;
}

export function wireReports(root: ParentNode = document): void {
  root.querySelectorAll<HTMLButtonElement>("[data-report-type]").forEach((button) => {
    if (button.dataset.wired === "1") return;
    button.dataset.wired = "1";
    const targetType = button.dataset.reportType || "";
    const targetId = button.dataset.reportId || "";
    button.addEventListener("click", () => {
      const fresh = reportControl(targetType, targetId);
      button.replaceWith(fresh);
      fresh.click();
    });
  });
}

export async function bootShell(): Promise<PublicUser | null> {
  const slot = document.querySelector("[data-auth]");
  let user: PublicUser | null = null;
  try {
    const data = await api<{ user: PublicUser | null }>("/api/auth/me");
    user = data.user;
  } catch {
    user = null;
  }
  if (!slot) return user;
  slot.replaceChildren();
  if (!user) {
    const link = document.createElement("a");
    link.href = "/account/";
    link.textContent = "Sign in";
    slot.append(link);
    return null;
  }
  slot.append(authorNode(user.username, user.isDemo));
  if (user.role === "admin") {
    const mod = document.createElement("a");
    mod.href = "/moderation/";
    mod.textContent = "Moderation";
    slot.append(mod);
  }
  const out = document.createElement("button");
  out.type = "button";
  out.className = "link-button";
  out.textContent = "Sign out";
  out.addEventListener("click", async () => {
    await api("/api/auth/logout", { method: "POST" });
    location.href = "/";
  });
  slot.append(out);
  return user;
}

export function setStatus(id: string, message: string): void {
  const node = document.getElementById(id);
  if (node) node.textContent = message;
}
