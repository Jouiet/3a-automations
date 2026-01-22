# ACP (Agent Communication Protocol) - DEPRECATED

> **Status**: OBSOLETE - Merged into A2A
> **Date**: 22/01/2026
> **Migration Target**: `automations/a2a/`

---

## Why ACP is Deprecated

As of **September 1, 2025**, IBM's Agent Communication Protocol (ACP) officially merged with Google's Agent2Agent (A2A) protocol under the Linux Foundation umbrella.

**Source**: [Linux Foundation Announcement](https://lfaidata.foundation/communityblog/2025/08/29/acp-joins-forces-with-a2a-under-the-linux-foundations-lf-ai-data/)

> *"By bringing the assets and expertise behind ACP into A2A, we can build a single, more powerful standard for how AI agents communicate and collaborate."* - Kate Blair, Director of Incubation, IBM Research

---

## Migration Path

| ACP Component | A2A Equivalent | Status |
|---------------|----------------|--------|
| `acp/server.js` | `a2a/server.js` | ✅ Migrated |
| `acp/routes.js` | `a2a/server.js` (JSON-RPC) | ✅ Migrated |
| `acp/compat-layer.js` | Deprecated | ❌ Removed |
| REST endpoints | JSON-RPC 2.0 | ✅ Standard |

---

## DO NOT USE

The following files in this directory are **legacy code** and should NOT be used:

- `server.js` - Use `../a2a/server.js` instead
- `routes.js` - Use A2A JSON-RPC methods instead
- `compat-layer.js` - No longer needed

---

## A2A Endpoints (Use These)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/a2a/v1` | JSON-RPC 2.0 handler |
| GET | `/a2a/v1/stream` | SSE event stream |
| GET | `/.well-known/agent.json` | Agent Card discovery |

---

## References

- [A2A Protocol Specification](https://a2a-protocol.org/latest/)
- [A2A GitHub Repository](https://github.com/a2aproject/A2A)
- [IBM ACP Archive](https://research.ibm.com/projects/agent-communication-protocol)
