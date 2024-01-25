# Certificates

For developing on localhost, you'll need self-signed certificates. Here's the command to get you going, courtesy of [Let's Encrypt](https://letsencrypt.org/docs/certificates-for-localhost/) (though slightly modified):

```sh
openssl req -x509 -out ./certs/localhost.crt -keyout ./certs/localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```

Run it from the project root, or modify the `-out` and `-keyout` accordingly.

You'll then need to add the _localhost.crt_ file to your trusted roots. On macOS, that can be done in Keychain Access, under the _login_ keychain and the _Certificates_ tab.
