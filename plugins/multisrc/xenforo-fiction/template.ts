import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';
import { CheerioAPI, load as parseHTML } from 'cheerio';

export type XenForoFictionOptions = {
  discoveryNode: string;
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
  version = '1.0.0';
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

  private parseThreadRows($: CheerioAPI): Plugin.NovelItem[] {
    const novels: Plugin.NovelItem[] = [];
    $('div.structItem.structItem--thread').each((_, el) => {
      const link = $(el).find('.structItem-title a').first();
      const path = link.attr('href');
      const name = link.text().trim();
      if (!path || !name) return;
      novels.push({ name, path, cover: defaultCover });
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

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const params = new URLSearchParams({
      q: searchTerm,
      o: 'relevance',
      page: pageNo.toString(),
    });
    const $ = await this.fetchDoc(`search/?${params.toString()}`);
    return this.parseThreadRows($);
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
    throw new Error(`Not implemented yet: ${chapterPath}`);
  }
}
