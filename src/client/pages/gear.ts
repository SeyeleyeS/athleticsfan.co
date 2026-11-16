import { api } from "../api";
import { authorNode, bootShell, fillProse, reportControl, setStatus } from "../ui";

type Listing = {
  id: string;
  title: string;
  price: string;
  externalUrl: string;
  photoUrl: string;
  description: string;
  author: { username: string; isDemo: boolean };
};

void bootShell();
void loadGear();

const form = document.getElementById("gear-form");
if (form instanceof HTMLFormElement) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const box = form.querySelector<HTMLInputElement>('input[name="noLicensedMarks"]');
    try {
      await api("/api/gear", {
        method: "POST",
        body: {
          title: String(data.get("title") || ""),
          price: String(data.get("price") || ""),
          externalUrl: String(data.get("externalUrl") || ""),
          photoUrl: String(data.get("photoUrl") || ""),
          description: String(data.get("description") || ""),
          noLicensedMarks: box?.checked === true,
        },
      });
      form.reset();
      setStatus("gear-status", "Listing posted. Buyers leave this site to pay.");
      await loadGear();
    } catch (error) {
      setStatus("gear-status", error instanceof Error ? error.message : "Could not post.");
    }
  });
}

async function loadGear(): Promise<void> {
  const list = document.getElementById("gear-list");
  if (!list) return;
  try {
    const data = await api<{ listings: Listing[] }>("/api/gear");
    list.replaceChildren();
    if (!data.listings.length) {
      list.textContent = "No handmade listings yet.";
      return;
    }
    for (const item of data.listings) {
      const card = document.createElement("article");
      card.className = "gear-card";
      const img = document.createElement("img");
      img.src = item.photoUrl;
      img.alt = "";
      img.width = 640;
      img.height = 400;
      img.referrerPolicy = "no-referrer";
      img.addEventListener("error", () => {
        img.replaceWith(Object.assign(document.createElement("p"), { textContent: "Photo unavailable." }));
      });
      const title = document.createElement("h2");
      title.textContent = item.title;
      const price = document.createElement("p");
      price.textContent = item.price;
      const desc = document.createElement("p");
      desc.className = "prose";
      fillProse(desc, item.description);
      const meta = document.createElement("p");
      meta.className = "meta";
      meta.append(authorNode(item.author.username, item.author.isDemo));
      const link = document.createElement("a");
      link.href = item.externalUrl;
      link.rel = "ugc noopener";
      link.target = "_blank";
      link.textContent = "Open the seller's link";
      const note = document.createElement("span");
      note.className = "sr-only";
      note.textContent = " (opens in a new tab)";
      link.append(note);
      card.append(img, title, price, desc, meta, link, reportControl("gear", item.id));
      list.append(card);
    }
  } catch {
    list.textContent = "Listings will load when the API is connected.";
  }
}
