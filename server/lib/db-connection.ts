export type DbClientConnectionParams = {
  user: string;
  password: string;
  host: string;
  name: string;
  schema: string;
};

export function validateConnectionParams(params: Partial<DbClientConnectionParams>): DbClientConnectionParams {
  for(const key of ['user', 'password', 'host', 'name', 'schema']) {
    if(!params[key]) {
      throw new Error(`${key} was not set in db connection params`);
    }
  }

  return params as DbClientConnectionParams;
}

export function makeConnectionString(params: DbClientConnectionParams) {
  return `postgresql://${params.user}:${params.password}@${params.host}/${params.name}?schema=${params.schema}`;
}
