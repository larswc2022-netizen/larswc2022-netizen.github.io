#!/usr/bin/env bash
# Usage: check-http.sh <BASE_URL>   e.g. https://user.github.io/repo  or http://127.0.0.1:8080
# Checks HTTP 200, JSON content-type, CORS header, timing and size for start.json and menu.json.
set -u
BASE="${1%/}"; fail=0
for f in start menu; do
  url="$BASE/msx/$f.json"
  hdr=$(mktemp)
  m=$(curl -sS -m 20 -D "$hdr" -o /dev/null -H 'Accept-Encoding: gzip' \
      -w '%{http_code} %{time_starttransfer} %{size_download} %{num_connects} %{ssl_verify_result}' "$url") || { echo "FAIL $url: curl error"; fail=1; continue; }
  set -- $m
  code=$1; ttfb=$2; size=$3; conns=$4; sslv=$5
  ctype=$(grep -i '^content-type:' "$hdr" | tr -d '\r' | head -1)
  acao=$(grep -i '^access-control-allow-origin:' "$hdr" | tr -d '\r' | head -1)
  enc=$(grep -i '^content-encoding:' "$hdr" | tr -d '\r' | head -1)
  cc=$(grep -i '^cache-control:' "$hdr" | tr -d '\r' | head -1)
  echo "== $url"; echo "   http=$code ttfb=${ttfb}s bytes_on_wire=$size connects=$conns ssl_verify=$sslv"
  echo "   ${ctype:-content-type: MISSING} | ${acao:-ACAO: MISSING} | ${enc:-content-encoding: none} | ${cc:-cache-control: none}"
  [ "$code" = "200" ] || { echo "   FAIL: status"; fail=1; }
  echo "$ctype" | grep -qi 'json' || { echo "   FAIL: content-type not json"; fail=1; }
  [ -n "$acao" ] || { echo "   FAIL: no CORS header"; fail=1; }
  case "$BASE" in https://*) [ "$sslv" = "0" ] || { echo "   FAIL: TLS verify"; fail=1; };; esac
  rm -f "$hdr"
done
exit $fail
