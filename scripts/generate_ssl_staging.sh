#!/bin/bash

# Script to generate self-signed SSL certificates for staging environment
# Usage: ./scripts/generate_ssl_staging.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Generating Self-Signed SSL Certificates for Staging${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Create SSL directory if it doesn't exist
SSL_DIR="./inventario-retail/nginx/ssl"
mkdir -p "$SSL_DIR"

# Certificate parameters
DAYS_VALID=365
COUNTRY="AR"
STATE="Buenos Aires"
CITY="Buenos Aires"
ORGANIZATION="AIDrive"
COMMON_NAME="staging-dashboard.local"
CERT_FILE="$SSL_DIR/cert.pem"
KEY_FILE="$SSL_DIR/key.pem"
CSR_FILE="$SSL_DIR/cert.csr"

echo -e "${BLUE}Generating private key...${NC}"
openssl genrsa -out "$KEY_FILE" 2048

echo -e "${BLUE}Generating certificate signing request...${NC}"
openssl req -new \
    -key "$KEY_FILE" \
    -out "$CSR_FILE" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORGANIZATION/CN=$COMMON_NAME"

echo -e "${BLUE}Generating self-signed certificate (valid for $DAYS_VALID days)...${NC}"
openssl x509 -req \
    -days $DAYS_VALID \
    -in "$CSR_FILE" \
    -signkey "$KEY_FILE" \
    -out "$CERT_FILE" \
    -extfile <(printf "subjectAltName=DNS:staging-dashboard.local,DNS:staging-dashboard,IP:127.0.0.1")

# Remove CSR file (not needed)
rm "$CSR_FILE"

# Set appropriate permissions
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

echo -e "${GREEN}✅ SSL Certificates generated successfully!${NC}"
echo -e ""
echo -e "${GREEN}Certificate Details:${NC}"
echo -e "  Certificate File: $CERT_FILE"
echo -e "  Key File: $KEY_FILE"
echo -e "  Common Name: $COMMON_NAME"
echo -e "  Valid Days: $DAYS_VALID"
echo -e "  Expires: $(openssl x509 -in $CERT_FILE -noout -enddate | cut -d= -f2)"
echo -e ""
echo -e "${BLUE}To view certificate details, run:${NC}"
echo -e "  openssl x509 -in $CERT_FILE -text -noout"
echo -e ""
echo -e "${BLUE}To add certificate to system trust (Linux):${NC}"
echo -e "  sudo cp $CERT_FILE /usr/local/share/ca-certificates/"
echo -e "  sudo update-ca-certificates"
echo -e ""
echo -e "${BLUE}To add certificate to system trust (macOS):${NC}"
echo -e "  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CERT_FILE"
echo -e ""
echo -e "${GREEN}Certificate ready for use in docker-compose.staging.yml${NC}"
