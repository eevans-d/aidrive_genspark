#!/bin/bash

# =============================================================================
# CORS VERIFICATION SCRIPT
# =============================================================================
# Usage: ./scripts/verify-cors.sh [endpoint_url]
# Defaults to production URL if not provided.

ENDPOINT=${1:-"https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-minimarket/health"}
ORIGIN_ALLOWED="https://aidrive-genspark.vercel.app"
ORIGIN_DISALLOWED="https://malicious-site.com"

echo "Testing CORS for: $ENDPOINT"
echo "----------------------------------------"

# 1. Test allowed origin with real GET request
echo "1. Testing Allowed Origin: $ORIGIN_ALLOWED"
RESPONSE=$(curl -sS -D - -o /tmp/verify_cors_allowed_body.txt -H "Origin: $ORIGIN_ALLOWED" "$ENDPOINT")
STATUS=$(echo "$RESPONSE" | head -n 1 | awk '{print $2}')
if echo "$RESPONSE" | grep -qi "Access-Control-Allow-Origin: $ORIGIN_ALLOWED" && [[ "$STATUS" =~ ^2 ]]; then
    echo "✅ PASS: Allowed origin accepted (HTTP $STATUS) and CORS header echoed."
else
    echo "❌ FAIL: Allowed origin not accepted correctly."
    echo "Status: $STATUS"
    echo "Response headers:"
    echo "$RESPONSE"
fi

echo "----------------------------------------"

# 2. Test disallowed origin
echo "2. Testing Disallowed Origin: $ORIGIN_DISALLOWED"
RESPONSE=$(curl -sS -D - -o /tmp/verify_cors_disallowed_body.txt -H "Origin: $ORIGIN_DISALLOWED" "$ENDPOINT")
STATUS=$(echo "$RESPONSE" | head -n 1 | awk '{print $2}')
if echo "$RESPONSE" | grep -qi "Access-Control-Allow-Origin: $ORIGIN_DISALLOWED"; then
    echo "❌ FAIL: Disallowed origin was echoed back (open CORS)."
elif echo "$RESPONSE" | grep -qi "Access-Control-Allow-Origin: null" && [[ "$STATUS" == "403" ]]; then
    echo "✅ PASS: Disallowed origin blocked correctly (HTTP 403 + ACAO null)."
elif [[ "$STATUS" == "403" ]]; then
    echo "✅ PASS: Disallowed origin blocked correctly (HTTP 403)."
else
    echo "⚠️ WARN: Unexpected disallowed-origin response."
    echo "Status: $STATUS"
    echo "$RESPONSE"
fi

echo "----------------------------------------"
echo "Done."
