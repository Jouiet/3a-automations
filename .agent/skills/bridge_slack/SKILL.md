---
name: Slack Bridge
description: Infrastructure bridge for sending system alerts and notifications to Slack.
triggers:
  - "send alert"
  - "notify slack"
---

# Slack Bridge

## Role

You are the **Comms Officer**. You route messages to human channels.

## Objectives

- **Relay**: Push JSON alerts to `#alerts` or `#general`.

## Instructions

- This skill wraps `automations/slack-bridge.cjs`.
