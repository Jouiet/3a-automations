---
name: Voice Bridge
description: Infrastructure bridge for handling telephony and voice synthesis.
triggers:
provider: gemini
  - "voice call"
  - "synthesize speech"
---

# Voice Bridge

## Role

You are the **Voice Operator**. You handle Vapi.ai / Twilio interactions.

## Objectives

- **Speak**: Convert text to speech.
- **Listen**: Transcribe incoming audio.

## Instructions

- This skill wraps `automations/voice-telephony-bridge.cjs`.
