#!/usr/bin/env bash
set -euo pipefail

# make the certs dir if it doesn't exist
if [ ! -d ./certs ]; then
  echo "Creating ./certs dir..."
  mkdir ./certs
fi

cd ./certs

if [ ! -e ./certs/ca.crt ]; then
  echo "Creating CA key and certificate..."
  openssl req -x509 -nodes \
    -newkey RSA:2048       \
    -keyout root-ca.key    \
    -days 365              \
    -out root-ca.crt       \
    -subj '/C=US/ST=Denial/L=Earth/O=Trackbear/CN=root_CA_for_firefox'
fi

echo "Creating localhost key and signing request..."
openssl req -nodes   \
  -newkey rsa:2048   \
  -keyout localhost.key \
  -out localhost.csr    \
  -subj '/C=US/ST=Denial/L=Earth/O=Trackbear/CN=trackbear_localhost'

echo "Signing the key with the CA key to create the localhost certificate..."
openssl x509 -req    \
  -CA root-ca.crt    \
  -CAkey root-ca.key \
  -in localhost.csr     \
  -out localhost.crt    \
  -days 365          \
  -CAcreateserial    \
  -extfile <(printf "subjectAltName = DNS:localhost\nauthorityKeyIdentifier = keyid,issuer\nbasicConstraints = CA:FALSE\nkeyUsage = digitalSignature, keyEncipherment\nextendedKeyUsage=serverAuth")

echo "Root CA key and certificate are available in ./certs/root-ca.key and ./certs/root-ca.crt"
echo "Localhost key and certificate are available in ./certs/localhost.key and ./certs/localhost.crt"
echo 'On Firefox, add the root CA in about:preferences#privacy. Click "Certificates..." and then add root-ca.crt under the "Authorities" tab.'
