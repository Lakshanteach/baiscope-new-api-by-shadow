// baiscope.lk scraper worker (search, info, dl, searchtv, dp, proxy)

const shadow_creator = "👨‍💻 SHADOW MOVIE X MAIN OWNER 👨‍💻";
const shadow_base_url = "https://www.baiscope.lk";

const shadow_headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,si;q=0.8",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  Referer: `${shadow_base_url}/`,
};

function shadow_json(payload, statusCode = 200) {
  return new Response(
    JSON.stringify(
      {
        creator: shadow_creator,
        ...payload,
      },
      null,
      2
    ),
    {
      status: statusCode,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

function shadow_has_telegram(inputStr = "") {
  if (!inputStr) return false;
  const s = String(inputStr).toLowerCase();
  if (/(?:^|[\s/:?=&@])t\s*\.\s*me(?:\/|$|\s|\?|&)/i.test(s)) return true;
  if (/telegram\s*\.\s*(?:me|dog|org)|tg\s*:/i.test(s)) return true;
  if (/\btelegram\b/i.test(s)) return true;
  return false;
}

function shadow_is_dead_or_bad_url(fullUrl = "", label = "") {
  const u = String(fullUrl || "").trim();
  const l = String(label || "").trim().toLowerCase();

  if (!u || !/^https?:\/\//i.test(u)) return true;
  if (shadow_has_telegram(u) || shadow_has_telegram(l)) return true;

  let parsed;
  try {
    parsed = new URL(u);
  } catch (_) {
    return true;
  }

  const host = parsed.hostname.toLowerCase();
  const p = parsed.pathname.toLowerCase();

  if (!host || !host.includes(".") || host === "localhost" || host.endsWith(".local")) {
    return true;
  }

  if (
    /(?:wa\.me|whatsapp\.com|twitter\.com|x\.com|facebook\.com|instagram\.com|pinterest\.com|reddit\.com|t\.me|telegram\.)/i.test(
      host
    ) ||
    p.includes("/cdn-cgi/") ||
    p.includes("/comment") ||
    p.includes("/category/") ||
    p.includes("/tag/") ||
    p.includes("/author/") ||
    p.startsWith("/search") ||
    p === "/" ||
    p === "/movies" ||
    p === "/tv" ||
    p === "/tv-series" ||
    /\/(?:login|signin|sign-in|signup|register|privacy|terms|cookies|copyright|dmca|contact|feedback|about|advertise|support|collections|articles|contributors|contribute)(?:\/|$)/i.test(
      p
    ) ||
    /^(?:reply|leave a comment|load more comments|privacy|terms|cookies|login|sign in|register|contact|about|dmca|next|previous)$/i.test(
      l
    ) ||
    /^(?:←\s*previous|next\s*→|give review\s*→|#sinhala\s+subtitle|#sinhala\s+subtitles|#සිංහල\s+උපසිරැසි)$/i.test(
      l
    )
  ) {
    return true;
  }

  return false;
}

function shadow_detect_quality(label = "", fullUrl = "") {
  const hay = `${label} ${fullUrl}`.toLowerCase();

  if (/\b(?:2160p|4k|uhd)\b/i.test(hay)) return "2160p (4K)";
  if (/\b1080p\b/i.test(hay)) return "1080p";
  if (/\b720p\b/i.test(hay)) return "720p";
  if (/\b480p\b/i.test(hay)) return "480p";
  if (/\b360p\b/i.test(hay)) return "360p";
  if (/\b(?:bluray|blu-ray|bdrip|brrip)\b/i.test(hay)) return "BluRay";
  if (/\b(?:web-dl|webdl|webrip)\b/i.test(hay)) return "WEB-DL";
  if (/\b(?:hdrip|dvdrip)\b/i.test(hay)) return "HDRip";
  if (/\b(?:cam|camrip|hdcam|ts|telesync)\b/i.test(hay)) return "CAM";
  if (
    /\.(?:zip|rar|srt|vtt|ass|sub)(?:\?|$)/i.test(fullUrl) ||
    /\/download\//i.test(fullUrl)
  ) {
    return "Subtitle";
  }

  return "Standard";
}

function shadow_abs_url(rawLink, baseOrigin = shadow_base_url) {
  if (!rawLink) return null;
  const trimmed = String(rawLink).trim();
  if (
    !trimmed ||
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("tg:")
  ) {
    return null;
  }
  try {
    const resolved = new URL(trimmed, baseOrigin).toString();
    if (shadow_has_telegram(resolved)) return null;
    return resolved;
  } catch (_) {
    return null;
  }
}

function shadow_strip_tags(rawHtml = "") {
  return String(rawHtml)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, "-")
    .replace(/&hellip;/g, "...")
    .replace(/&rarr;/g, "→")
    .replace(/\s+/g, " ")
    .trim();
}

function shadow_is_cf_challenge(htmlText = "") {
  return /__cf_chl_|cf-browser-verification|just a moment\.\.\.|checking your browser before accessing/i.test(
    htmlText
  );
}

function shadow_is_junk_item(title = "", fullUrl = "", pathname = "") {
  const t = String(title).trim().toLowerCase();
  const p = String(pathname).trim().toLowerCase();
  const u = String(fullUrl).trim().toLowerCase();

  if (shadow_is_dead_or_bad_url(fullUrl, title)) return true;

  if (
    p === "/" ||
    p === "/movies" ||
    p === "/tv" ||
    p === "/collections" ||
    p === "/support" ||
    p === "/articles" ||
    p === "/about" ||
    p === "/contact" ||
    p === "/contributors" ||
    p === "/contribute" ||
    p === "/copyright" ||
    p === "/cookies" ||
    p === "/feedback" ||
    p === "/advertise" ||
    p.startsWith("/search") ||
    p.startsWith("/category/") ||
    p.startsWith("/tag/") ||
    p.startsWith("/page/") ||
    p.includes("/author/") ||
    p.includes("/wp-") ||
    u.includes("?sort=") ||
    u.includes("?language=") ||
    u.includes("become-a-contributor") ||
    /\.(?:jpg|jpeg|png|gif|webp|css|js|xml)$/i.test(p)
  ) {
    return true;
  }

  const junkTitles = new Set([
    "movies",
    "tv series",
    "collections",
    "support",
    "become a contributor",
    "advertise with us",
    "articles",
    "latest",
    "top rated",
    "english",
    "tamil",
    "hindi",
    "korean",
    "malayalam",
    "telugu",
    "japanese",
    "sinhala",
    "about",
    "contact",
    "contributors",
    "dmca / takedown",
    "privacy",
    "cookies",
    "අලුත් site එක ගැන අදහසක්",
    "give review →",
    "next →",
  ]);

  if (junkTitles.has(t) || /^next\b/i.test(t) || /^give review\b/i.test(t)) {
    return true;
  }

  const isContentPath = /^\/(?:movies|tv|series|episodes|subtitles)\/[^/]+/i.test(p);
  const hasMediaHint =
    /sinhala\s*sub|උපසිරැසි|s\d{1,2}\s*[:e]?\s*e?\d{1,2}|\(\d{4}\)|tv series|movie/i.test(t);

  return !(isContentPath || hasMediaHint);
}

async function shadow_fetch_html(targetUrl) {
  const abortCtrl = new AbortController();
  const timerId = setTimeout(() => abortCtrl.abort(), 15000);

  try {
    const res = await fetch(targetUrl, {
      signal: abortCtrl.signal,
      headers: shadow_headers,
      redirect: "follow",
    });

    const bodyText = await res.text();
    const challenged = shadow_is_cf_challenge(bodyText);

    return {
      status: res.status,
      ok: res.ok && !challenged,
      challenged,
      finalUrl: res.url || targetUrl,
      html: bodyText,
    };
  } finally {
    clearTimeout(timerId);
  }
}

function shadow_parse_results(html, baseUrl, mode = "all") {
  const seenUrls = new Set();
  const items = [];

  for (const anchor of html.matchAll(
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  )) {
    const fullUrl = shadow_abs_url(anchor[1], baseUrl);
    if (!fullUrl) continue;

    let parsed;
    try {
      parsed = new URL(fullUrl);
    } catch (_) {
      continue;
    }

    if (!parsed.hostname.endsWith("baiscope.lk")) continue;
    const pLower = parsed.pathname.toLowerCase();
    const cleanTitle = shadow_strip_tags(anchor[2]);

    if (!cleanTitle || cleanTitle.length < 3) continue;
    if (shadow_is_junk_item(cleanTitle, fullUrl, pLower)) continue;
    if (seenUrls.has(fullUrl)) continue;

    const surrounding = html.slice(
      Math.max(0, anchor.index - 550),
      Math.min(html.length, anchor.index + anchor[0].length + 550)
    );

    const isTvEntry =
      /\/(?:tv|series|episodes)\//i.test(pLower) ||
      /\bs\d{1,2}\s*[:e]?\s*e?\d{1,2}\b|\btv series\b|\bseason\b|\bepisode\b|කතාමාලාව/i.test(
        `${cleanTitle} ${surrounding}`
      );

    // Strictly separate TV series vs Movies
    if (mode === "tv" && !isTvEntry) {
      continue;
    }
    if (mode === "movie" && isTvEntry) {
      continue;
    }

    seenUrls.add(fullUrl);

    const imgMatch = surrounding.match(
      /<img\b[^>]*?(?:data-src|src)=["'](https?:\/\/[^"']+)["']/i
    );
    const posterUrl = imgMatch ? shadow_abs_url(imgMatch[1], fullUrl) : null;

    items.push({
      title: cleanTitle,
      url: fullUrl,
      image: posterUrl,
    });
  }

  return items;
}

async function shadow_search_items(queryText, pageNum = 1, mode = "movie") {
  const safePage = Math.max(1, parseInt(pageNum, 10) || 1);
  const searchUrl =
    safePage > 1
      ? `${shadow_base_url}/search?q=${encodeURIComponent(queryText)}&page=${safePage}`
      : `${shadow_base_url}/search?q=${encodeURIComponent(queryText)}`;

  const fetched = await shadow_fetch_html(searchUrl);
  if (!fetched.ok) {
    return {
      ok: false,
      query: queryText,
      page: safePage,
      source: searchUrl,
      cloudflareChallenge: fetched.challenged,
      error: fetched.challenged
        ? "Blocked by Cloudflare challenge on baiscope.lk"
        : `HTTP ${fetched.status}`,
      items: [],
    };
  }

  const items = shadow_parse_results(fetched.html, fetched.finalUrl, mode);

  return {
    ok: true,
    query: queryText,
    page: safePage,
    source: fetched.finalUrl,
    total: items.length,
    items,
  };
}

async function shadow_scrape_info(targetUrl) {
  const fetched = await shadow_fetch_html(targetUrl);
  if (!fetched.ok) {
    return {
      ok: false,
      url: targetUrl,
      cloudflareChallenge: fetched.challenged,
      error: fetched.challenged
        ? "Blocked by Cloudflare challenge on baiscope.lk"
        : `HTTP ${fetched.status}`,
    };
  }

  const html = fetched.html;

  const h1Match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const ogTitleMatch = html.match(
    /<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
  );
  const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  const title =
    (h1Match && shadow_strip_tags(h1Match[1])) ||
    (ogTitleMatch && shadow_strip_tags(ogTitleMatch[1])) ||
    (titleTagMatch && shadow_strip_tags(titleTagMatch[1])) ||
    "Unknown Title";

  const ogImgMatch = html.match(
    /<meta\b[^>]*property=["']og:image["'][^>]*content=["'](https?:\/\/[^"']+)["']/i
  );
  const image = ogImgMatch ? shadow_abs_url(ogImgMatch[1], fetched.finalUrl) : null;

  const ogDescMatch = html.match(
    /<meta\b[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i
  );
  const metaDescMatch = html.match(
    /<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
  );
  const description =
    (ogDescMatch && shadow_strip_tags(ogDescMatch[1])) ||
    (metaDescMatch && shadow_strip_tags(metaDescMatch[1])) ||
    null;

  const plainText = shadow_strip_tags(html);
  const imdbMatch = plainText.match(
    /IMDb(?:\s*Rating)?\s*[:\-]?\s*([0-9](?:\.[0-9])?\s*\/\s*10|[0-9](?:\.[0-9])?)/i
  );
  const yearMatch = plainText.match(/\b(19\d{2}|20\d{2})\b/);

  return {
    ok: true,
    url: fetched.finalUrl,
    title,
    image,
    imdb: imdbMatch ? imdbMatch[1].replace(/\s+/g, "") : null,
    year: yearMatch ? yearMatch[1] : null,
    description,
  };
}

async function shadow_scrape_links(targetUrl, mode = "dl") {
  const fetched = await shadow_fetch_html(targetUrl);
  if (!fetched.ok) {
    return {
      ok: false,
      url: targetUrl,
      cloudflareChallenge: fetched.challenged,
      error: fetched.challenged
        ? "Blocked by Cloudflare challenge on baiscope.lk"
        : `HTTP ${fetched.status}`,
      links: [],
      subtitles: [],
    };
  }

  const html = fetched.html;
  const seenLinks = new Set();
  const links = [];
  const subtitles = [];

  for (const anchor of html.matchAll(
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  )) {
    const absLink = shadow_abs_url(anchor[1], fetched.finalUrl);
    if (!absLink || seenLinks.has(absLink)) continue;

    const label = shadow_strip_tags(anchor[2]) || "Download";
    if (shadow_is_dead_or_bad_url(absLink, label)) continue;
    if (/\.(?:jpg|jpeg|png|gif|webp|bmp|svg)(?:\?|$)/i.test(absLink)) continue;

    let parsedLink;
    try {
      parsedLink = new URL(absLink);
    } catch (_) {
      continue;
    }

    const linkPath = parsedLink.pathname.toLowerCase();
    const isOtherPost =
      /^\/(?:movies|tv|series|episodes)\/[^/]+/i.test(linkPath) &&
      absLink !== fetched.finalUrl;

    const isDirectFileOrHost =
      /\.(?:mp4|mkv|avi|webm|7z|iso|torrent|zip|rar|srt|vtt|ass|sub)(?:\?|$)/i.test(absLink) ||
      /\/download\/[^/?#]+/i.test(linkPath) ||
      /(?:pixeldrain|gdrive|drive\.google\.com|mega\.nz|mediafire\.com|1fichier\.com|gofile\.io|terabox\.com|uptobox\.com|ddl|mirror)/i.test(
        absLink
      );

    if (isOtherPost && !isDirectFileOrHost) continue;

    const quality = shadow_detect_quality(label, absLink);
    const lowerCombo = `${absLink} ${label}`.toLowerCase();

    if (
      quality === "Subtitle" ||
      /\.(?:zip|rar|srt|vtt|ass|sub)(?:\?|$)/i.test(absLink) ||
      /\/download\/[^/?#]+/i.test(linkPath)
    ) {
      seenLinks.add(absLink);
      subtitles.push({
        label,
        quality: "Subtitle",
        url: absLink,
      });
      continue;
    }

    const matchPattern =
      mode === "dp"
        ? /\.(?:mp4|mkv|avi|webm|7z|iso|torrent)(?:\?|$)|(?:pack|season|batch|mirror|pixeldrain|gdrive|drive\.google|mega\.nz|mediafire|1fichier|gofile|terabox|480p|720p|1080p|2160p|4k)/i
        : /\.(?:mp4|mkv|avi|webm|7z|iso|torrent)(?:\?|$)|(?:mirror|pixeldrain|gdrive|drive\.google|mega\.nz|mediafire|1fichier|gofile|terabox|480p|720p|1080p|2160p|4k)/i;

    if (matchPattern.test(lowerCombo)) {
      seenLinks.add(absLink);
      links.push({
        label,
        quality,
        url: absLink,
      });
    }
  }

  return {
    ok: true,
    url: fetched.finalUrl,
    mode,
    totalLinks: links.length,
    totalSubtitles: subtitles.length,
    links,
    subtitles,
  };
}

async function shadow_proxy_download(targetUrl) {
  const res = await fetch(targetUrl, {
    headers: {
      ...shadow_headers,
      Referer: `${shadow_base_url}/`,
    },
    redirect: "follow",
  });

  const outHeaders = new Headers();
  const passthrough = ["content-type", "content-length", "content-disposition"];
  for (const h of passthrough) {
    const val = res.headers.get(h);
    if (val) outHeaders.set(h, val);
  }
  outHeaders.set("Access-Control-Allow-Origin", "*");

  return new Response(res.body, {
    status: res.status,
    headers: outHeaders,
  });
}

export default {
  async fetch(req) {
    if (req.method === "OPTIONS") {
      return shadow_json({ ok: true }, 200);
    }

    const parsedUrl = new URL(req.url);
    const routePath = parsedUrl.pathname.replace(/\/+$/, "") || "/";

    try {
      if (routePath === "/health") {
        return shadow_json({
          ok: true,
          status: "ready",
          target: shadow_base_url,
          endpoints: [
            "/search?q=<query>&page=1",
            "/info?url=<baiscope_url>",
            "/dl?url=<baiscope_url>",
            "/searchtv?q=<query>&page=1",
            "/dp?url=<baiscope_url>",
            "/proxy?url=<download_url>",
          ],
        });
      }

      if (routePath === "/search") {
        const q = (parsedUrl.searchParams.get("q") || "").trim();
        const page = parsedUrl.searchParams.get("page") || "1";
        if (!q) {
          return shadow_json({ ok: false, error: "Missing 'q' query parameter" }, 400);
        }
        const data = await shadow_search_items(q, page, "movie");
        return shadow_json(data, data.ok ? 200 : 502);
      }

      if (routePath === "/searchtv") {
        const q = (parsedUrl.searchParams.get("q") || "").trim();
        const page = parsedUrl.searchParams.get("page") || "1";
        if (!q) {
          return shadow_json({ ok: false, error: "Missing 'q' query parameter" }, 400);
        }
        const data = await shadow_search_items(q, page, "tv");
        return shadow_json(data, data.ok ? 200 : 502);
      }

      if (routePath === "/info") {
        const target = (parsedUrl.searchParams.get("url") || "").trim();
        if (!target || !/^https?:\/\//i.test(target)) {
          return shadow_json({ ok: false, error: "Valid 'url' query parameter required" }, 400);
        }
        const data = await shadow_scrape_info(target);
        return shadow_json(data, data.ok ? 200 : 502);
      }

      if (routePath === "/dl") {
        const target = (parsedUrl.searchParams.get("url") || "").trim();
        if (!target || !/^https?:\/\//i.test(target)) {
          return shadow_json({ ok: false, error: "Valid 'url' query parameter required" }, 400);
        }
        const data = await shadow_scrape_links(target, "dl");
        return shadow_json(data, data.ok ? 200 : 502);
      }

      if (routePath === "/dp") {
        const target = (parsedUrl.searchParams.get("url") || "").trim();
        if (!target || !/^https?:\/\//i.test(target)) {
          return shadow_json({ ok: false, error: "Valid 'url' query parameter required" }, 400);
        }
        const data = await shadow_scrape_links(target, "dp");
        return shadow_json(data, data.ok ? 200 : 502);
      }

      if (routePath === "/proxy") {
        const target = (parsedUrl.searchParams.get("url") || "").trim();
        if (!target || !/^https?:\/\//i.test(target) || shadow_has_telegram(target)) {
          return shadow_json({ ok: false, error: "Valid non-telegram 'url' required" }, 400);
        }
        return await shadow_proxy_download(target);
      }

      return shadow_json({ ok: false, error: "Endpoint not found" }, 404);
    } catch (err) {
      return shadow_json(
        {
          ok: false,
          error: err?.message || "Worker error",
        },
        500
      );
    }
  },
};
