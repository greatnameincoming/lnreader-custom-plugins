import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';
import { CheerioAPI, load as parseHTML } from 'cheerio';

export type XenForoFictionOptions = {
  discoveryNode: string;
  /**
   * Set when this site's /search/ is blocked for automated requests
   * (e.g. Cloudflare managed challenge, confirmed present on SpaceBattles
   * regardless of pacing/headers). searchNovels throws a clear error
   * instead of attempting a request that will always fail.
   */
  searchUnavailable?: boolean;
};

export type XenForoFictionMetadata = {
  id: string;
  sourceSite: string;
  sourceName: string;
  options: XenForoFictionOptions;
};

const BROWSER_HEADERS = {
  'Accept-Language': 'en-US,en;q=0.9',
};

export class XenForoFictionPlugin implements Plugin.PagePlugin {
  id: string;
  name: string;
  icon: string;
  site: string;
  version = '1.0.1';
  options: XenForoFictionOptions;

  constructor(metadata: XenForoFictionMetadata) {
    this.id = metadata.id;
    this.name = metadata.sourceName;
    this.icon = `multisrc/xenforo-fiction/${metadata.id}/icon.png`;
    this.site = metadata.sourceSite;
    this.options = metadata.options;
  }

  private async fetchDoc(path: string): Promise<CheerioAPI> {
    const url = new URL(path, this.site).toString();
    const result = await fetchApi(url, {
      headers: { ...BROWSER_HEADERS, Referer: this.site },
    });
    const body = await result.text();
    return parseHTML(body);
  }

  private resolveCover(row: ReturnType<CheerioAPI>): string {
    const src = row.find('.avatar img').first().attr('src');
    return src ? new URL(src, this.site).toString() : defaultCover;
  }

  private parseThreadRows($: CheerioAPI): Plugin.NovelItem[] {
    const novels: Plugin.NovelItem[] = [];
    $('div.structItem.structItem--thread').each((_, el) => {
      const row = $(el);
      if (row.find('.structItem-status--sticky').length > 0) return;
      const link = row.find('.structItem-title a').first();
      const path = link.attr('href');
      const name = link.text().trim();
      if (!path || !name) return;
      novels.push({ name, path, cover: this.resolveCover(row) });
    });
    return novels;
  }

  private parseSearchRows($: CheerioAPI): Plugin.NovelItem[] {
    const novels: Plugin.NovelItem[] = [];
    $('li.block-row').each((_, el) => {
      const row = $(el);
      const link = row.find('.contentRow-title a').first();
      const path = link.attr('href');
      const name = link.text().trim();
      if (!path || !name) return;
      novels.push({ name, path, cover: this.resolveCover(row) });
    });
    return novels;
  }

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    const path =
      pageNo > 1
        ? `${this.options.discoveryNode}page-${pageNo}`
        : this.options.discoveryNode;
    const $ = await this.fetchDoc(path);
    return this.parseThreadRows($);
  }

  async searchNovels(searchTerm: string): Promise<Plugin.NovelItem[]> {
    if (this.options.searchUnavailable) {
      throw new Error(
        `${this.name} blocks automated access to /search/ (Cloudflare); search is not available for this source. Browse the listing instead.`,
      );
    }

    // XenForo's search is a CSRF-protected POST, not a plain GET with query
    // params (GET /search/?q=... just serves the empty search form) — the
    // CSRF token is bound to a session cookie issued by the GET below, so
    // that cookie must be forwarded explicitly on the POST (fetch does not
    // do this automatically across separate calls, and cannot be relied on
    // to do so inside the app's own fetch runtime either).
    const searchPageUrl = new URL('search/', this.site).toString();
    const getResult = await fetchApi(searchPageUrl, {
      headers: { ...BROWSER_HEADERS, Referer: this.site },
    });
    const getHtml = await getResult.text();
    const token = parseHTML(getHtml)('input[name="_xfToken"]')
      .first()
      .attr('value');
    const rawSetCookie = getResult.headers.getSetCookie
      ? getResult.headers.getSetCookie()
      : getResult.headers.get('set-cookie')
        ? [getResult.headers.get('set-cookie') as string]
        : [];
    const cookie = rawSetCookie.map(c => c.split(';')[0]).join('; ');

    const body = new URLSearchParams({
      keywords: searchTerm,
      'c[title_only]': '1',
      _xfToken: token ?? '',
    });
    const postResult = await fetchApi(
      new URL('search/search', this.site).toString(),
      {
        method: 'POST',
        headers: {
          ...BROWSER_HEADERS,
          Referer: searchPageUrl,
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: cookie,
        },
        body: body.toString(),
      },
    );
    const html = await postResult.text();
    return this.parseSearchRows(parseHTML(html));
  }

  private parseThreadmarkRows($: CheerioAPI): Plugin.ChapterItem[] {
    const chapters: Plugin.ChapterItem[] = [];
    $('div.structItem.structItem--threadmark').each((_, el) => {
      const row = $(el);
      const link = row.find('.structItem-title a').first();
      const path = link.attr('href');
      const name = link.text().trim();
      if (!path || !name) return;
      const timestamp = row.attr('data-content-date');
      chapters.push({
        name,
        path,
        releaseTime: timestamp
          ? new Date(Number(timestamp) * 1000).toISOString()
          : null,
      });
    });
    return chapters;
  }

  private getTotalPages($: CheerioAPI): number {
    const max = $('.pageNavWrapper input.js-pageJumpPage').first().attr('max');
    return max ? Number(max) : 1;
  }

  async parseNovel(
    novelPath: string,
  ): Promise<Plugin.SourceNovel & { totalPages: number }> {
    const $ = await this.fetchDoc(`${novelPath}threadmarks`);

    const chapters = this.parseThreadmarkRows($);
    if (chapters.length === 0) {
      throw new Error(
        'This thread has no threadmarks; unsupported by this plugin.',
      );
    }

    return {
      path: novelPath,
      name: $('h1.p-title-value').first().text().trim() || 'Untitled',
      cover: defaultCover,
      author: $('div.structItem.structItem--threadmark')
        .first()
        .attr('data-content-author'),
      summary: $('.threadmarkListingHeader-extraInfoChild .bbWrapper')
        .first()
        .text()
        .trim(),
      status: NovelStatus.Unknown,
      chapters,
      totalPages: this.getTotalPages($),
    };
  }

  async parsePage(novelPath: string, page: string): Promise<Plugin.SourcePage> {
    const $ = await this.fetchDoc(
      `${novelPath}threadmarks?per_page=25&page=${page}`,
    );
    return { chapters: this.parseThreadmarkRows($) };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const postId = chapterPath.match(/#post-(\d+)/)?.[1];
    if (!postId) {
      throw new Error(
        `Could not find a post id in chapter path: ${chapterPath}`,
      );
    }

    const $ = await this.fetchDoc(chapterPath);
    const post = $(`article[data-content="post-${postId}"]`);
    const content = post.find('.message-userContent .bbWrapper').first();

    content.find('blockquote.bbCodeBlock').remove();
    content.find('.message-signature').remove();
    content.find('img[data-src]').each((_, img) => {
      const dataSrc = $(img).attr('data-src');
      if (dataSrc) $(img).attr('src', dataSrc);
    });

    return content.html() || '';
  }
}
