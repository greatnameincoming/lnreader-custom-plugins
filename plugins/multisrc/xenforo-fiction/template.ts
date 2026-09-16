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

  async popularNovels(pageNo: number): Promise<Plugin.NovelItem[]> {
    throw new Error(`Not implemented yet: ${pageNo}`);
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    throw new Error(`Not implemented yet: ${searchTerm} ${pageNo}`);
  }

  async parseNovel(
    novelPath: string,
  ): Promise<Plugin.SourceNovel & { totalPages: number }> {
    throw new Error(`Not implemented yet: ${novelPath}`);
  }

  async parsePage(novelPath: string, page: string): Promise<Plugin.SourcePage> {
    throw new Error(`Not implemented yet: ${novelPath} ${page}`);
  }

  async parseChapter(chapterPath: string): Promise<string> {
    throw new Error(`Not implemented yet: ${chapterPath}`);
  }
}
