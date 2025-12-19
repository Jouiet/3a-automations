#!/usr/bin/env python3
"""
3A Automation - Grok Voice Agent POC
Version: 1.0
Created: 2025-12-19

POC for xAI Grok Voice Agent API integration.
Uses LiveKit Agents framework for real-time voice conversations.

PRICING: $0.05/min (cheapest in market)
LATENCY: <1 second time-to-first-audio
LANGUAGES: 100+ with native accents
VOICES: Sal, Rex, Eve, Leo, Mika, Valentin

Requirements:
    pip install livekit-agents livekit-plugins-xai python-dotenv

Usage:
    1. Console test: python grok-voice-poc.py console
    2. Server mode:  python grok-voice-poc.py

Configuration:
    Set XAI_API_KEY in .env file
    Get key from: https://console.x.ai/api-keys

Documentation:
    - xAI Voice API: https://docs.x.ai/docs/guides/voice
    - LiveKit: https://docs.livekit.io/agents/
"""

import os
import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Load environment from project root
env_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(env_path)

# Configuration
XAI_API_KEY = os.getenv('XAI_API_KEY')
VOICE = os.getenv('GROK_VOICE', 'Sal')  # Options: Sal, Rex, Eve, Leo, Mika, Valentin

# 3A Automation System Prompt for Voice
VOICE_SYSTEM_PROMPT = """Tu es l'assistant vocal IA de 3A Automation.

IDENTITE:
- Consultant solo en Automation, Analytics et AI
- Site: 3a-automation.com
- Langues: Francais, Anglais, Arabe

EXPERTISE:
- Email automation (Klaviyo)
- Analytics (GA4, dashboards)
- E-commerce (Shopify)
- Integrations API

OFFRE GRATUITE: Audit e-commerce complet

STYLE VOCAL:
- Reponses courtes et naturelles
- Maximum 2-3 phrases par reponse
- Ton professionnel mais accessible
- Pas de jargon technique excessif
- Propose toujours l'audit gratuit comme prochaine etape

SI QUESTION PRIX:
- Packs Setup: 390 a 1490 euros
- Retainers: 290 a 890 euros par mois
- Audit gratuit disponible pour commencer

NE PAS:
- Faire de promesses non verifiees
- Donner des estimations de temps
- S'engager sur des resultats specifiques
"""

def check_dependencies():
    """Check if required packages are installed."""
    missing = []

    try:
        import livekit.agents
    except ImportError:
        missing.append('livekit-agents')

    try:
        import livekit.plugins.xai
    except ImportError:
        missing.append('livekit-plugins-xai')

    if missing:
        print("=" * 60)
        print("MISSING DEPENDENCIES")
        print("=" * 60)
        print(f"\nInstall with: pip install {' '.join(missing)}")
        print("\nOr install all requirements:")
        print("pip install livekit-agents livekit-plugins-xai python-dotenv")
        print("=" * 60)
        return False

    return True


def check_api_key():
    """Check if XAI API key is configured."""
    if not XAI_API_KEY:
        print("=" * 60)
        print("ERROR: XAI_API_KEY not configured")
        print("=" * 60)
        print("\nTo configure:")
        print("1. Go to https://console.x.ai/api-keys")
        print("2. Create a new API key")
        print("3. Add to .env: XAI_API_KEY=your_key_here")
        print("\nNote: Requires $5 minimum credit to activate")
        print("=" * 60)
        return False

    # Mask key for display
    masked = XAI_API_KEY[:8] + "..." + XAI_API_KEY[-4:]
    print(f"XAI_API_KEY: {masked}")
    return True


async def run_console_test():
    """Run a simple console test without LiveKit server."""
    print("\n" + "=" * 60)
    print("GROK VOICE POC - Console Test Mode")
    print("=" * 60)
    print(f"\nVoice: {VOICE}")
    print("This is a text-based test. For full voice, run server mode.")
    print("-" * 60)

    # Test xAI API connection with text
    import aiohttp

    url = "https://api.x.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {XAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "grok-2-latest",
        "messages": [
            {"role": "system", "content": VOICE_SYSTEM_PROMPT},
            {"role": "user", "content": "Bonjour, presente-toi brievement."}
        ],
        "max_tokens": 150,
        "temperature": 0.7
    }

    print("\nTesting xAI API connection...")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    reply = data["choices"][0]["message"]["content"]
                    print("\n3A Voice Assistant:")
                    print(reply)
                    print("\n" + "=" * 60)
                    print("API CONNECTION: OK")
                    print("Ready for voice integration!")
                    print("=" * 60)
                    return True
                else:
                    error = await response.text()
                    print(f"\nAPI Error ({response.status}): {error}")
                    return False
    except Exception as e:
        print(f"\nConnection Error: {e}")
        return False


async def run_voice_agent():
    """Run the full voice agent with LiveKit."""
    try:
        from livekit.agents import AgentServer, AgentSession, Agent
        from livekit.plugins import xai
    except ImportError:
        print("LiveKit not installed. Run console test instead.")
        return await run_console_test()

    print("\n" + "=" * 60)
    print("GROK VOICE AGENT - Server Mode")
    print("=" * 60)
    print(f"Voice: {VOICE}")
    print("Starting LiveKit agent server...")
    print("-" * 60)

    class ThreeAAssistant(Agent):
        """3A Automation Voice Assistant."""

        def __init__(self):
            super().__init__(
                instructions=VOICE_SYSTEM_PROMPT,
            )

    server = AgentServer()

    @server.rtc_session()
    async def request_handler(req):
        session = AgentSession(
            llm=xai.realtime.RealtimeModel(
                voice=VOICE,
            ),
        )
        await session.start(room=req.room, agent=ThreeAAssistant())
        await session.generate_reply(
            instructions="Salue l'utilisateur et propose ton aide pour l'automation."
        )

    # Start server
    await server.run()


def print_info():
    """Print POC information."""
    print("\n" + "=" * 60)
    print("3A AUTOMATION - GROK VOICE AGENT POC")
    print("=" * 60)
    print("\nXAI GROK VOICE API FACTS:")
    print("-" * 40)
    print("Pricing:    $0.05/minute (industry cheapest)")
    print("Latency:    <1 second time-to-first-audio")
    print("Languages:  100+ with native accents")
    print("Benchmark:  #1 Big Bench Audio")
    print("-" * 40)
    print("\nAVAILABLE VOICES:")
    print("  - Sal (default)")
    print("  - Rex")
    print("  - Eve")
    print("  - Leo")
    print("  - Mika")
    print("  - Valentin")
    print("-" * 40)
    print("\nFEATURES:")
    print("  - Full-duplex WebSocket (talk while AI speaks)")
    print("  - Barge-in support (interrupt naturally)")
    print("  - Auto language detection")
    print("  - Real-time tool calling")
    print("  - X and web search integration")
    print("=" * 60)


async def main():
    """Main entry point."""
    print_info()

    # Check API key
    if not check_api_key():
        sys.exit(1)

    # Check dependencies
    has_livekit = check_dependencies()

    # Determine mode
    mode = sys.argv[1] if len(sys.argv) > 1 else "info"

    if mode == "console":
        # Console test mode (text-based)
        try:
            import aiohttp
        except ImportError:
            print("Install aiohttp: pip install aiohttp")
            sys.exit(1)

        success = await run_console_test()
        sys.exit(0 if success else 1)

    elif mode == "server" and has_livekit:
        # Full voice agent mode
        await run_voice_agent()

    else:
        # Info mode
        print("\nUSAGE:")
        print("-" * 40)
        print("python grok-voice-poc.py console  # Test API connection")
        print("python grok-voice-poc.py server   # Run voice agent")
        print("python grok-voice-poc.py          # Show this info")
        print("-" * 40)

        if not has_livekit:
            print("\nTo enable full voice mode, install:")
            print("pip install livekit-agents livekit-plugins-xai")

        print("\nNEXT STEPS:")
        print("1. Run 'console' mode to test API connection")
        print("2. Install LiveKit for full voice integration")
        print("3. Set up LiveKit Cloud account")
        print("4. Deploy voice agent for production use")


if __name__ == "__main__":
    asyncio.run(main())
