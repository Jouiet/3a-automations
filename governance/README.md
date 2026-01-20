# 3A Governance Layer (Claude Cowork Integrated)

This directory is the **Bridge** between the **A2A Autonomous System** and the **Human-in-the-Loop (Claude Cowork)**.

## Workflow: The "Command Center"

1. **Proposal**: Agents (Growth, Cinematic) generate "Decision Artifacts" (Proposals) in `governance/proposals/`.
2. **Review**: You (via Claude Cowork) open the Artifact, review the strategy, and **Modify/Comment**.
3. **Approval**: Change the Status in the Artifact to `APPROVED`.
4. **Execution**: The Agent reads the approved Artifact and executes the tactics.

## Directory Structure

- `proposals/`: Pending decisions (Budget Plans, Content Calendars).
- `logs/`: Execution logs (Audits, Results).
- `schemas/`: Validation schemas for artifacts.

## Usage with Claude Cowork

* "Claude, check `governance/proposals/` and summarize pending decisions."
- "Claude, optimize the budget plan in `proposal_123.md`."
- "Claude, approve all highly confident plans."
