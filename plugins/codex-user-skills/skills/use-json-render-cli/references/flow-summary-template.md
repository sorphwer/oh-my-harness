# Flow Summary Template (No Temp JSON Files)

Render a three-stage flow/timeline summary with deterministic spacing and status badges.

## 1) Fill values

```bash
export TITLE="Incident Response Timeline"
export UPDATED_AT="Updated Tue 19:20"

export STAGE1_NAME="Detect"
export STAGE1_STATUS="DONE"
export STAGE1_TIME="18:03"
export STAGE1_NOTE="Alert fired for elevated checkout error rate and on-call acknowledged."

export STAGE2_NAME="Mitigate"
export STAGE2_STATUS="IN PROGRESS"
export STAGE2_TIME="18:34"
export STAGE2_NOTE="Rollback is complete and traffic is stabilizing while validation checks continue."

export STAGE3_NAME="Review"
export STAGE3_STATUS="BLOCKED"
export STAGE3_TIME="Pending"
export STAGE3_NOTE="Postmortem remains blocked until payment provider trace data arrives."

export OUT_PATH="${OUT_PATH:-/tmp/flow-summary.png}"

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
    "${CODEX_HOME:-$HOME/.codex}/skills/use-json-render-cli/references/flow-summary-spec.template.json" \
    "./npm/skills/use-json-render-cli/references/flow-summary-spec.template.json" \
    "./skills/use-json-render-cli/references/flow-summary-spec.template.json"
  do
    if [ -f "$candidate" ]; then
      export SPEC_PATH="$candidate"
      break
    fi
  done
fi
if [ -z "${SPEC_PATH:-}" ] || [ ! -f "$SPEC_PATH" ]; then
  echo "Cannot find flow-summary-spec.template.json. Set SPEC_PATH explicitly." >&2
  exit 1
fi

# Optional manual overrides:
# export VIEWPORT_WIDTH=980
# export VIEWPORT_HEIGHT=360
if [ -z "${VIEWPORT_WIDTH:-}" ] || [ -z "${VIEWPORT_HEIGHT:-}" ]; then
  eval "$(python3 - <<'PY'
import math
import os

notes = [
  os.environ.get("STAGE1_NOTE", "").strip(),
  os.environ.get("STAGE2_NOTE", "").strip(),
  os.environ.get("STAGE3_NOTE", "").strip(),
]
max_note_len = max(len(n) for n in notes) if notes else 0
chars_per_line = 86
note_lines = max(1, math.ceil(max(1, max_note_len) / chars_per_line))
viewport_height = max(308, min(620, 250 + note_lines * 44))

print("export VIEWPORT_WIDTH=980")
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
  "__UPDATED_AT__": os.environ["UPDATED_AT"],
  "__STAGE1_NAME__": os.environ["STAGE1_NAME"],
  "__STAGE1_STATUS__": os.environ["STAGE1_STATUS"],
  "__STAGE1_TIME__": os.environ["STAGE1_TIME"],
  "__STAGE1_NOTE__": os.environ["STAGE1_NOTE"],
  "__STAGE2_NAME__": os.environ["STAGE2_NAME"],
  "__STAGE2_STATUS__": os.environ["STAGE2_STATUS"],
  "__STAGE2_TIME__": os.environ["STAGE2_TIME"],
  "__STAGE2_NOTE__": os.environ["STAGE2_NOTE"],
  "__STAGE3_NAME__": os.environ["STAGE3_NAME"],
  "__STAGE3_STATUS__": os.environ["STAGE3_STATUS"],
  "__STAGE3_TIME__": os.environ["STAGE3_TIME"],
  "__STAGE3_NOTE__": os.environ["STAGE3_NOTE"],
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
  "canvas": { "background": "#ffffff", "padding": 10 }
}
JSON
) \
  -o "$OUT_PATH" \
  --size "${VIEWPORT_WIDTH}x${VIEWPORT_HEIGHT}"
```

If this command is executed by a sub-agent, keep `"$OUT_PATH"` and let the main agent decide final cleanup.
