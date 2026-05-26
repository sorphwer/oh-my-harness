---
name: ticket-reply-wording
description: Use when polishing a support ticket reply from a raw solution or conclusion into Riino's writing style. Triggers when user asks to draft, polish, or reword a ticket response.
---

# Ticket Reply Wording

Polish raw solutions/conclusions into Riino's distinctive support ticket reply style.

**This skill is for wording only.** Do not analyze the problem or change the technical content. Take the solution as-is and reformat it.

## Input / Output

- **Input:** A raw solution, conclusion, or bullet points describing what to tell the customer
- **Output:** A complete, send-ready ticket reply in Riino's style

Auto-detect language from input. If ambiguous, default to Chinese.

## Style Rules

### Structure (strict order)

1. **Greeting:** "您好，" (CN) or "Hi," (EN) — always on its own or followed by a line break
2. **Body:** Solution content, direct and concise
3. **Sign-off:** "Regards,\nRiino"

No filler. No "感谢您的反馈". No "祝好". No "希望以上信息对您有所帮助". Get to the point right after greeting.

### Tone

- **Professional but conversational** — not corporate-stiff, not casual
- **CN:** Always use "您" (formal you), never "你"
- **Collaborative:** Use "我们" (we) — position as partner, not authority
- **Direct:** Lead with conclusion or action, not background
- **Honest about limitations:** "不好意思，我们设计上确实没有充分为您这种架构提供最佳的兼容性。"

### Body Patterns

**Single solution → direct statement:**
```
您好，
推荐升级到 3.7.4，尤其是考虑到我们最新版修复了多个高危CVE漏洞。
其中会有几个 non-skippable 版本，详见 https://...

Regards,
Riino
```

**Multiple solutions → numbered 方案:**
```
您好，

经过我们实际实验，结论是：dify 集群支持连接外部 redis，但有前提条件：

方案1: 您使用单机或者 sentinel 模式。
方案2: 您需要确保 Dify Pod 能访问所有 Redis 节点的实际 IP ...
方案3（理论可行）: 您在 redis 前额外部署搭建 proxy 服务 ...

Regards,
Riino
```

**Troubleshooting steps → numbered checklist with "请确认"/"请":**
```
您好，
根据目前的情况，建议收集更多信息。由于其他节点 dify-api 正常，
我们目前排除是 Dify 产品缺陷导致该问题。

以下是几个可能的方向供您参考：
请确认节点资源（CPU/内存/磁盘）充足
请确认该节点与其他节点是否有网络连接的差异
请确认该节点的操作系统配置和其他节点是否有差异

Regards,
Riino
```

**Asking customer for info → end with reason:**
```
您好，

建议您先尝试浏览器获取该请求，并提供具体响应（尤其是状态码），
这有助于我们进一步提供支持。

Regards,
Riino
```

**Admitting limitation → lead with apology, then alternatives:**
```
您好，
不好意思我们设计上确实没有充分为您这种架构提供最佳的兼容性。
目前建议的替代方案是 ...

Regards,
Riino
```

**Feature not available → honest + roadmap link + workaround:**
```
您好，
细粒度的RBAC我们目前计划在明年实施，目前不能控制"允许部分人查看对话记录日志"。
详见：https://...
现阶段您可通过外接 Langfuse 等工具来实施对对话日志的更好的管控。

Regards,
Riino
```

### Key Phrases (CN)

| Situation | Phrase |
|-----------|--------|
| Presenting conclusion | "经过我们实际实验，结论是：" |
| Current assessment | "根据目前的情况" |
| Suggesting | "建议您" / "您可尝试" |
| Requesting action | "请确认" / "请您重点检查" |
| Multiple directions | "以下是几个可能的方向供您参考" |
| Requesting info | "这有助于我们进一步提供支持" |
| Linking docs | "详见 [URL]" |
| Config emphasis | "务必将 X 设为 Y" |
| Limitation | "不好意思，我们设计上..." / "目前没有这个考虑" |

### Key Phrases (EN)

| Situation | Phrase |
|-----------|--------|
| Presenting conclusion | "Based on our testing, the conclusion is:" |
| Suggesting | "We recommend..." / "You can try..." |
| Multiple directions | "Here are a few possible directions:" |
| Linking docs | "See [URL] for details." |
| Limitation | "Unfortunately, our current design doesn't fully support this architecture." |

### Formatting

- Code/config in fenced blocks (yaml, bash, etc.)
- Env vars inline with backticks: `REDIS_USE_CLUSTERS=true`
- Emoji only for analysis headers: ✅ ⚠️ 🔍 — never decorative
- No markdown headers in the reply body (no ## or ###)
- Keep paragraphs short — 1-3 sentences max

## What NOT to Do

- Do NOT add "感谢您的反馈/来信" or "感谢您联系我们"
- Do NOT add "祝好" or "祝您一切顺利"
- Do NOT add "希望以上信息对您有所帮助"
- Do NOT over-explain each solution option — be concise like the examples
- Do NOT use "你" — always "您"
- Do NOT add analysis or diagnosis beyond what was provided in the input
- Do NOT use "亲" or overly casual language
- Do NOT change the technical content — polish wording only
