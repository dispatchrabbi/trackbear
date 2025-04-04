import { libcurl } from "libcurl.js";
import libcurlWasm from '../../../node_modules/libcurl.js/libcurl.wasm?url';

import qs from 'qs';

type ApiCallOptions = {
  useCsrf?: boolean;
};

type RawHeader = [
  string, // header name
  string, // header value
];

type FetchResponse<T> = {
  ok: boolean,
  status: number;
  headers: RawHeader[];
  payload: T,
}

type YwpBookResponse = {
  id: number;
  title: string;
  synopsis: string;
  wordcount: number;
  slug: string;
  url: string; // https://ywp.nanowrimo.org/books/<slug>.json but this URL actually doesn't work
};

type YwpChallengeParticipantStatsResponse = {
  id: number; // actually the book ID
  title: string;
  target: number;
  start_wordcount: number;
  wordcount: number;
  updated_at: string;
  start_dt: string;
  end_dt: string;
  wordcounts: {
    id: number;
    created_at: string;
    wordcount: number;
    bookcount: number;
  }[];
};

export type YwpBook = {
  id: number;
  title: string;
  synopsis: string;
  slug: string;
  total: number;
};

type YwpChallengeStub = {
  id: number;
  bookId: number;
  name: string;
};

export type YwpChallenge = YwpChallengeStub & {
  goal: number;
  startDatetime: string;
  endDatetime: string;
};

type YwpWordcountStub = {
  id: number;
  bookId: number;
  createdAtDatetime: string;
  totalCount: number;
};

export type YwpWordcount = {
  id: number;
  bookId: number;
  createdAtDatetime: string;
  totalCount: number;
  delta: number;
};

export default class YoungWritersProgram {
  static API_PREFIX = 'https://ywp.nanowrimo.org';

  csrfToken = null;
  cookie = null;

  async init() {
    await libcurl.load_wasm(libcurlWasm);
    libcurl.set_websocket(`wss://${location.hostname}${location.port ? ':' + location.port : ''}/wisp/`);
  }

  async login(username: string, password: string) {
    await this._loadHomepage();

    const signInPayload = new FormData();
    signInPayload.append('user[login]', username);
    signInPayload.append('user[password]', password);

    const signInResponse = await this.callApi<unknown>(YoungWritersProgram.API_PREFIX + '/users/sign_in.json', 'POST', signInPayload, null, { useCsrf: true });
    if(signInResponse.status === 401) {
      throw new Error('Invalid credentials');
    } else if(!signInResponse.ok) {
      throw new Error(`An unknown error occurred: ${signInResponse.status}`);
    }
  }

  async _loadHomepage() {
    const homepageResponse = await this.callApi<string>(YoungWritersProgram.API_PREFIX + '/');
    if(!homepageResponse.ok) {
      throw new Error(`Could not load YWP homepage: ${homepageResponse.status}`);
    }

    const parser = new DOMParser();
    const document = parser.parseFromString(homepageResponse.payload, 'text/html');

    // <meta name="csrf-token" content="(a base-64-encoded value)" />
    const csrfMetaElement: HTMLMetaElement = document.querySelector('meta[name=csrf-token]') as HTMLMetaElement;
    if(!csrfMetaElement) {
      throw new Error(`Could not find CSRF token in YWP homepage`);
    }

    this.csrfToken = csrfMetaElement.content;
  }

  // Okay, so here's what we gotta do.
  // First, grab https://ywp.nanowrimo.org/books.json so we have all the info for projects
  // Then go to each book's page (/novels/:id) and grab all the challenge participant ids from data-challenge_participant_id and also the challenge names
  // Then grab https://ywp.nanowrimo.org/challenge_participants/id/stats.json so we have all the info for goals and tallies
  // Translate each wordcount so that it has a delta instead of a new total for wordcount
  async exportData() {
    if(!this.cookie) {
      throw new Error('Must be logged in before you can export data!');
    }

    const books = await this._getBooks();
    const challenges = [];
    const wordcountStubs = [];

    for(const book of books) {
      const stubs = await this._getChallengeInfo(book);
      for(const stub of stubs) {
        const stats = await this._getChallengeStats(stub);
        challenges.push(stats.challenge);
        wordcountStubs.push(...stats.wordcounts);
      }
    }

    const wordcounts = this._deltafyWordcounts(wordcountStubs);

    return {
      books,
      challenges,
      wordcounts,
    };
  }

  async _getBooks(): Promise<YwpBook[]> {
    const response = await this.callApi<YwpBookResponse[]>(YoungWritersProgram.API_PREFIX + '/books.json');
    if(!response.ok) {
      throw new Error(`An unknown error occurred: ${response.status}`);
    }

    const books: YwpBook[] = response.payload.map(book => ({
      id: book.id,
      title: book.title,
      synopsis: book.synopsis,
      slug: book.slug,
      total: book.wordcount,
    }));

    return books;
  }

  async _getChallengeInfo(book: YwpBook): Promise<YwpChallengeStub[]> {
    const response = await this.callApi<string>(YoungWritersProgram.API_PREFIX + `/novels/${book.slug}`);
    if(!response.ok) {
      throw new Error(`An unknown error occurred: ${response.status}`);
    }

    // We can't get away with regex matching for this one. Gotta actually parse the HTML...
    const parser = new DOMParser();
    const document = parser.parseFromString(response.payload, 'text/html');
    
    const challengeParticipantIdElements: HTMLElement[] = [...document.querySelectorAll('[data-challenge_participant_id]').values()] as HTMLElement[];
    const challengeParticipantIds = [...new Set(challengeParticipantIdElements.map(el => +el.dataset.challenge_participant_id))];

    const challengeNameElements: HTMLElement[] = [...document.querySelectorAll('.cp_slider').values()] as HTMLElement[];
    const challengeNameMap = challengeNameElements.reduce((obj, el) => {
      const challengeParticipantId = el.dataset.challenge_participant_id;
      const challengeName = el.childNodes[0].textContent.split('\n')[1];

      obj[challengeParticipantId] = challengeName;
      return obj;
    }, {});

    const challengeStubs: YwpChallengeStub[] = challengeParticipantIds.map(id => ({
      id,
      bookId: book.id,
      name: challengeNameMap[id] ?? book.title,
    }));

    return challengeStubs;
  }

  async _getChallengeStats(challengeStub: YwpChallengeStub): Promise<{ challenge: YwpChallenge, wordcounts: YwpWordcountStub[] }> {
    const response = await this.callApi<YwpChallengeParticipantStatsResponse>(YoungWritersProgram.API_PREFIX + `/challenge_participants/${challengeStub.id}/stats.json`);
    if(!response.ok) {
      throw new Error(`An unknown error occurred: ${response.status}`);
    }

    const responsePayload = response.payload;

    const challenge: YwpChallenge = {
      ...challengeStub,
      goal: responsePayload.target,
      startDatetime: responsePayload.start_dt,
      endDatetime: responsePayload.end_dt,
    };

    const wordcounts: YwpWordcountStub[] = responsePayload.wordcounts.map(wc => ({
      id: wc.id,
      bookId: challengeStub.bookId,
      createdAtDatetime: wc.created_at,
      totalCount: wc.bookcount, // use bookcount; wordcount only works when you did your writing in the YWP site
    }));

    return {
      challenge,
      wordcounts,
    };
  }

  _deltafyWordcounts(stubs: YwpWordcountStub[]) {
    const bookIds = [...new Set(stubs.map(stub => stub.bookId))];
    const wordcounts: YwpWordcount[] = [];

    for(const bookId of bookIds) {
      const sortedBookStubs = stubs
        .filter(stub => stub.bookId === bookId)
        .sort((a, b) => a.createdAtDatetime < b.createdAtDatetime ? -1 : a.createdAtDatetime > b.createdAtDatetime ? 1 : 0);
      
      const bookWordcounts: YwpWordcount[] = sortedBookStubs.map((stub, ix, arr) => ({
        ...stub,
        delta: ix > 0 ? (stub.totalCount - arr[ix - 1].totalCount) : stub.totalCount,
      }));

      wordcounts.push(...bookWordcounts);
    }

    return wordcounts;
  }

  async callApi<T>(path: string, method: string = 'GET', payload: Record<string, unknown> | Record<string, unknown>[] | FormData | null = null, query: object | null = null, options: ApiCallOptions = {}): Promise<FetchResponse<T>> {
    const headers = {
      'User-Agent': 'TrackBear (https://github.com/dispatchrabbi/trackbear/)',
    };
    let body = null;

    if(options.useCsrf) {
      if(!this.csrfToken) {
        throw new Error('Wanted to use CSRF Token but none was set');
      }

      headers['X-CSRF-Token'] = this.csrfToken;
    }
    
    if(this.cookie) {
      headers['Cookie'] = this.cookie;
    }

    if(payload instanceof FormData) {
      body = stringifyFormData(payload);
      headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
    } else if(payload !== null) {
      body = JSON.stringify(payload);
      headers['Content-Type'] = 'application/json';
    }

    if(query !== null) {
      path += '?' + qs.stringify(query, { arrayFormat: 'comma', encode: false });
    }

    const response = await libcurl.fetch(path, {
      method,
      headers,
      body,
    });

    const rawCookie = headerValue(response.raw_headers, 'Set-Cookie');
    if(rawCookie) {
      this.cookie = rawCookie.split(';')[0];
    }

    let responsePayload: T = null;
    if((headerValue(response.raw_headers, 'Content-Type') ?? '').includes('application/json')) {
      responsePayload = await response.json();
    } else {
      responsePayload = await response.text() as T;
    }

    return {
      ok: response.ok,
      status: response.status,
      headers: response.raw_headers,
      payload: responsePayload,
    };
  }
}

function stringifyFormData(formData: FormData) {
  const formDataObj = [...formData.entries()].reduce((obj, [k, v]) => {
    obj[k] = v;
    return obj;
  }, {});

  return qs.stringify(formDataObj);
}

function headerValue(rawHeaders: RawHeader[], headerName: string): string | undefined {
  const foundPair = rawHeaders.find(pair => pair[0] === headerName);
  return foundPair ? foundPair[1] : undefined;
}