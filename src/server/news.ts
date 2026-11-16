import newsFile from "../../config/news-links.json";
import { escapeHtml } from "./markup";

export type NewsLink = {
  id: string;
  label: string;
  publisher: string;
  url: string;
  description: string;
  region: string;
  verified: boolean;
  note?: string;
};

export const newsLinks = newsFile.links as NewsLink[];
export const newsCheckedOn = newsFile.checkedOn;

export function linksByIds(ids: string[]): NewsLink[] {
  return ids.flatMap((id) => {
    const link = newsLinks.find((item) => item.id === id);
    return link ? [link] : [];
  });
}

export function renderNewsList(links: NewsLink[]): string {
  if (!links.length) return "";
  return `<ul class="link-list">${links.map(renderNewsItem).join("")}</ul>`;
}

export function renderNewsItem(link: NewsLink): string {
  const badge = link.verified
    ? ""
    : `<span class="flag flag-warn">Not confirmed</span>`;
  const note = link.note ? `<p class="fine">${escapeHtml(link.note)}</p>` : "";
  return `<li>
    <a href="${escapeHtml(link.url)}" rel="noopener" target="_blank">${escapeHtml(link.label)}<span class="sr-only"> (opens in a new tab)</span></a>
    <span class="publisher">${escapeHtml(link.publisher)}</span>
    ${badge}
    <p>${escapeHtml(link.description)}</p>
    ${note}
  </li>`;
}
