# TODO: API Access

## Prep
- [ ] Replace API error codes with constants
- [ ] Should methods that return EmptyObject actually return null?

## Documentation

- [x] Document API key-accessible methods

## API Keys

- [x] Add API key table: key, name, permissions, expiration
- [ ] Add API key usage record table: id, api key id, app name, app details, last used
- [ ] Create API section in Settings
- [ ] Implement API key creation workflow
- [ ] Implement API key deletion workflow

## API Access

- [x] Implement authentication via API
- [x] API rate limiting
- [x] Add API access to (some) endpoints