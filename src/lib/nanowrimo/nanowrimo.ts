import qs from 'qs';

type FetchResponse<T> = {
  ok: boolean;
  status: number;
  payload: T;
};

type NaNoWriMoEntity = {
  id: number;
  type: string;
  links: Record<string, string>;
  attributes: Record<string, unknown>;
  relationships: Record<string, { links: Record<string, string> }>;
};

type NaNoWriMoSingleResponse = {
  data: NaNoWriMoEntity;
  included?: NaNoWriMoEntity[];
};

type NaNoWriMoCollectionResponse = {
  data: NaNoWriMoEntity[];
  included?: NaNoWriMoEntity[];
};

export type NaNoWriMoProject = {
  id: number;
  title: string;
  summary: string;
  total: number;
  createdAt: string;
};

export type NaNoWriMoChallenge = {
  id: number;
  projectId: number;
  name: string;
  goal: number;
  startDate: string;
  endDate: string;
};

export type NaNoWriMoSession = {
  id: number;
  projectId: number;
  challengeId: number;
  date: string;
  count: number;
};

export default class NaNoWriMo {
  static API_PREFIX = 'https://api.nanowrimo.org';

  jwt = null;
  userId = null;

  async login(username: string, password: string) {
    const signInPayload = {
      identifier: username,
      password: password,
    };
    const signInResponse = await this.callApi<{ auth_token: string }>(NaNoWriMo.API_PREFIX + '/users/sign_in', 'POST', signInPayload);
    if(signInResponse.status === 401) {
      throw new Error('Invalid credentials');
    } else if(!signInResponse.ok) {
      throw new Error(`An unknown error occurred: ${signInResponse.status}`);
    }

    this.jwt = signInResponse.payload.auth_token;

    const currentUserResponse = await this.callApi<NaNoWriMoSingleResponse>(NaNoWriMo.API_PREFIX + '/users/current');
    if(!currentUserResponse.ok) {
      throw new Error(`An unknown error occurred: ${signInResponse.status}`);
    }

    this.userId = currentUserResponse.payload.data.id;
  }

  async getProjectInfo() {
    if(!(this.jwt && this.userId)) {
      throw new Error('Must be logged in before calling getProjectInfo()');
    }

    const query = {
      'filter[user_id]': this.userId,
      'include': 'project-challenges,project-sessions',
    };
    const response = await this.callApi<NaNoWriMoCollectionResponse>(NaNoWriMo.API_PREFIX + '/projects', 'GET', null, query);
    if(!response.ok) {
      throw new Error(`An unknown error occurred: ${response.status}`);
    }

    const sessions = response.payload.included.filter(e => e.type === 'project-sessions').map(session => ({
      id: +session.id,
      challengeId: session.attributes['project-challenge-id'],
      projectId: session.attributes['project-id'],
      count: session.attributes.count,
      date: session.attributes['session-date'],
    })) as NaNoWriMoSession[];

    const challenges = response.payload.included.filter(e => e.type === 'project-challenges').map(challenge => ({
      id: +challenge.id,
      projectId: challenge.attributes['project-id'],
      name: challenge.attributes.name,
      goal: challenge.attributes.goal,
      startDate: challenge.attributes['starts-at'],
      endDate: challenge.attributes['ends-at'],
    })) as NaNoWriMoChallenge[];

    const projects = response.payload.data.map(project => ({
      id: +project.id,
      title: project.attributes.title,
      summary: project.attributes.summary,
      total: project.attributes['unit-count'],
      createdAt: project.attributes['created-at'],
    })) as NaNoWriMoProject[];

    return {
      projects,
      challenges,
      sessions,
    };
  }

  async callApi<T>(path: string, method: string = 'GET', payload: Record<string, unknown> | Record<string, unknown>[] | FormData | null = null, query: object | null = null): Promise<FetchResponse<T>> {
    const headers = {
      'User-Agent': 'TrackBear (https://github.com/dispatchrabbi/trackbear/)',
    };
    let body = null;

    if(this.jwt) {
      headers['Authorization'] = this.jwt;
    }

    if(payload instanceof FormData) {
      body = payload;
      // do not set Content-Type; this allows fetch to set the multipart/form-data boundary itself
    } else if(payload !== null) {
      body = JSON.stringify(payload);
      headers['Content-Type'] = 'application/json';
    }

    if(query !== null) {
      path += '?' + qs.stringify(query, { arrayFormat: 'comma', encode: false });
    }

    const response = await fetch(path, {
      method,
      headers,
      body,
    });

    const responsePayload: T = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      payload: responsePayload,
    };
  }
}
