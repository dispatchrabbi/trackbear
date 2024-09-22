# Certificates

For developing on localhost, you'll need self-signed certificates. You can create your own CA and self-signed certificates using the `regenerate-certs.sh` script:

```sh
./scripts/regenerate-certs.sh`
```

If you're on Firefox and macOS, you then will need to:
- [Make sure that Firefox trusts third-party root CAs](https://support.mozilla.org/en-US/kb/automatically-trust-third-party-certificates)
- Add _certs/root-ca.crt_ to your Keychain under Certificates
- Right-click that certificate, hit **Get Info**, and then select "Always Trust" under Trust > SSL
- Restart Firefox