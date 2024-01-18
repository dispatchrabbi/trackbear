import process from 'process';

const PORT = process.env.PORT || 3000;
const USE_HTTPS = !!+(process.env.USE_HTTPS || '0');

// allow self-signed certs during development
if(process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

async function healthcheck() {
  const url = `http${USE_HTTPS ? 's' : ''}://localhost:${PORT}/api/ping`;
  const result = await fetch(url);

  if(result.ok) {
    return true;
  } else {
    throw new Error(`/api/ping STATUS ${result.status}`);
  }
}

// return value 0 for a positive health check; 1 for an error
// writing out a message means you can see it with `docker inspect`
// see https://docs.docker.com/engine/reference/builder/#healthcheck
healthcheck()
  .then(() => process.exit(0))
  .catch(err => {
    console.log(err);
    process.exit(1);
  });
