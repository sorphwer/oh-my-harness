# Daily Summary Card Template (No Temp JSON Files)

Render a single summary card with key highlights and a short narrative.

## 1) Fill values

```bash
export TITLE="Daily Platform Summary"
export KEY_1="Requests: 1.94M"
export KEY_2="Success Rate: 99.92%"
export KEY_3="P95 Latency: 287ms"
export SUMMARY="Traffic increased 6.3% day-over-day with stable latency. Error volume stayed flat, and no customer-facing incidents were recorded."
export UPDATED_AT="Tue 18:10"
export OUT_PATH="${OUT_PATH:-/tmp/daily-summary.png}"

if ! command -v json-render >/dev/null 2>&1; then
  npm i -g json-render-cli
fi
export JSON_RENDER_CMD="${JSON_RENDER_CMD:-json-render}"

# Ensure Playwright Chromium is available for screenshots
PW_CHROMIUM_DIR="$(
  npx --yes playwright install --dry-run chromium 2>/dev/null \
    | awk -F': +' '/chromium v/ { seen=1 } seen && /Install location:/ { print $2; exit }'
)"
if [ -z "${PW_CHROMIUM_DIR:-}" ] || [ ! -d "$PW_CHROMIUM_DIR" ]; then
  npx --yes playwright install chromium
fi

if [ -z "${SPEC_PATH:-}" ]; then
  for candidate in \
    "${CODEX_HOME:-$HOME/.codex}/skills/use-json-render-cli/references/daily-summary-spec.template.json" \
    "./npm/skills/use-json-render-cli/references/daily-summary-spec.template.json" \
    "./skills/use-json-render-cli/references/daily-summary-spec.template.json"
  do
    if [ -f "$candidate" ]; then
      export SPEC_PATH="$candidate"
      break
    fi
  done
fi
if [ -z "${SPEC_PATH:-}" ] || [ ! -f "$SPEC_PATH" ]; then
  echo "Cannot find daily-summary-spec.template.json. Set SPEC_PATH explicitly." >&2
  exit 1
fi

# Optional manual overrides:
# export VIEWPORT_WIDTH=984
# export VIEWPORT_HEIGHT=188
if [ -z "${VIEWPORT_WIDTH:-}" ] || [ -z "${VIEWPORT_HEIGHT:-}" ]; then
  eval "$(python3 - <<'PY'
import math
import os

summary = os.environ.get("SUMMARY", "").strip()
summary_len = len(summary)
chars_per_line = 88
summary_lines = max(1, math.ceil(max(1, summary_len) / chars_per_line))
viewport_height = max(168, min(420, 126 + summary_lines * 24))

print("export VIEWPORT_WIDTH=984")
print(f"export VIEWPORT_HEIGHT={viewport_height}")
PY
)"
fi
```

## 2) Build message JSON in memory

```bash
MESSAGE_JSON="$(python3 - <<'PY'
import json, os, pathlib
p = pathlib.Path(os.environ["SPEC_PATH"])
tpl = p.read_text(encoding="utf-8")
m = {
  "__TITLE__": os.environ["TITLE"],
  "__KEY_1__": os.environ["KEY_1"],
  "__KEY_2__": os.environ["KEY_2"],
  "__KEY_3__": os.environ["KEY_3"],
  "__SUMMARY__": os.environ["SUMMARY"],
  "__UPDATED_AT__": os.environ["UPDATED_AT"],
}
for k, v in m.items():
  tpl = tpl.replace(k, json.dumps(v, ensure_ascii=False)[1:-1])
print(tpl)
PY
)"
```

## 3) Render

```bash
"$JSON_RENDER_CMD" \
  -m "$MESSAGE_JSON" \
  -c <(cat <<JSON
{
  "version": 1,
  "catalog": {
    "allowedComponents": ["Container", "Row", "Column", "Card", "Heading", "Text", "Badge", "Divider", "Spacer", "Button", "Image"],
    "componentDefaults": {}
  },
  "theme": { "mode": "system" },
  "viewport": { "width": ${VIEWPORT_WIDTH}, "height": ${VIEWPORT_HEIGHT}, "deviceScaleFactor": 2 },
  "screenshot": { "type": "png", "omitBackground": false, "fullPage": true },
  "canvas": { "background": "#ffffff", "padding": 12 }
}
JSON
) \
  -o "$OUT_PATH" \
  --size "${VIEWPORT_WIDTH}x${VIEWPORT_HEIGHT}"
```

If this command is executed by a sub-agent, keep `"$OUT_PATH"` and let the main agent decide final cleanup.
