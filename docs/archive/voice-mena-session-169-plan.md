# Voice MENA - Session 169 Plan d'Action + Historique Corrections
> Archivé le 06/02/2026 (Session 191ter) - Contenu historique déplacé depuis VOICE-MENA-PLATFORM-ANALYSIS.md

## PLAN D'ACTION SESSION 169 (27/01/2026)

### Actions IMMÉDIATES (Cette semaine)

| # | Action | Owner | Deadline | Status |
|---|--------|-------|----------|--------|
| 1 | ~~Deploy Atlas-Chat-9B sur RunPod/Vast.ai~~ **Intégré via HuggingFace Inference API** | Dev | Session 170 | ✅ **DONE** |
| 2 | Tester Mistral Saba API pour Darija | Dev | J+2 | ⏳ TODO |
| 3 | Provisioning premier DID Telnyx +212 | Ops | J+1 | ⏳ TODO |
| 4 | Intégrer WhatsApp Business Calling API | Dev | J+7 | ⏳ TODO |

### Actions P1 (Ce mois)

| # | Action | Justification | Effort |
|---|--------|---------------|--------|
| 5 | Benchmark latence Atlas-Chat vs Grok | Valider fallback chain | Moyen |
| 6 | Premier client test PSTN Morocco | Validation terrain | Élevé |
| 7 | Documentation API 3A Voice publique | Différenciation vs SAWT IA | Moyen |

### Actions P2 (Ce trimestre)

| # | Action | Dépendance |
|---|--------|------------|
| 8 | Contact AtlasIA pour license commerciale | Résultat test Atlas-Chat |
| 9 | Expansion UAE/KSA via WhatsApp Voice | Validation Morocco |
| 10 | Optimisation latence 2.5s → 1s | Infrastructure |

### DÉCISIONS PRISES Session 169

| Décision | Justification | Impact |
|----------|---------------|--------|
| **Atlas-Chat-9B comme fallback** | License Gemma OK, Production ready | Résilience LLM Darija |
| **AtlasIA = NON pour l'instant** | CC BY-NC = commercial impossible | Évite risque légal |
| **Mistral MoU ≠ partenariat B2B** | Government focus, pas PME | Réalisme |
| **Self-hosted > API pour LLM Darija** | Contrôle, pas de vendor lock-in | Indépendance |

### MÉTRIQUES À SUIVRE

| Métrique | Cible | Actuel | Gap |
|----------|-------|--------|-----|
| Latence round-trip | <1s | 2.5s | -1.5s |
| COGS Web Widget | <$0.01/min | $0.007/min | ✅ |
| COGS PSTN Morocco | <$0.05/min | $0.044/min | ✅ |
| Clients actifs | 10 | 0 | -10 |

---

### Historique des Corrections

#### v5.5.2 (27/01/2026) - Analyse LLM Darija Partenariats + Plan d'Action

| Ajout | Détail | Impact |
|-------|--------|--------|
| **Atlas-Chat-9B** | Fallback Darija validé (Gemma license) | Résilience stack |
| **AtlasIA verdict** | CC BY-NC = NON commercial | Clarification légale |
| **Mistral Saba** | Darija non confirmé, MoU ≠ B2B | Réalisme |
| **Coût hosting** | RunPod $400/mois, ~$0.01/min | Budget prévu |
| **Plan d'action** | 10 actions priorisées P0/P1/P2 | Exécution |

#### v5.5.1 (27/01/2026) - Benchmark Technique + RED FLAGS SAWT IA

| Ajout | Détail | Impact |
|-------|--------|--------|
| **RED FLAGS SAWT IA** | "ML in-house" claim peu crédible | Réalisme concurrentiel |
| **Benchmark Global** | Vapi 500ms, Retell 800ms, 3A 2.5s | Latence à optimiser |

#### v5.5 (27/01/2026) - Analyse Concurrentielle + Architecture Solution Complète + Benchmark Technique

| Ajout | Détail | Impact |
|-------|--------|--------|
| **Stratégies Telephony Concurrents** | Sawt (STC), Maqsam (propre), Kalimna (Twilio), Retell/Vapi (global) | Compréhension marché |
| **Gap Concurrentiel** | Aucun concurrent n'a WhatsApp Voice MENA | **First-mover advantage** |
| **Architecture Reseller** | 3A offre numéro INCLUS via Telnyx/CommPeak API | Différenciation PME |
| **Provisioning API** | Telnyx `POST /v2/phone_numbers` documenté | Automatisation |
| **Pricing Reseller** | DID $1/mois absorbé dans ARPU | Marge préservée |
| **Tableau Différenciation** | 10 critères vs concurrents MENA + Global | Positionnement clair |
| **Benchmark SAWT IA détaillé** | 12 critères, pricing, features, sectors | Concurrent direct analysé |
| **RED FLAGS SAWT IA** | "ML in-house" claim peu crédible (1 dev, marketing background) | Réalisme |
| **Benchmark Technique Global** | Retell (800ms), Vapi (500ms), Bland (20k/hr) | Latence vs capacité |
| **Limitations MENA concurrents** | Pas Darija, pas DIDs, VoIP bloqué | Gap critique identifié |

#### v5.4 (27/01/2026) - Solutions Telephony MENA VÉRIFIÉES

| Découverte | Impact | Source Vérifiée |
|------------|--------|-----------------|
| **Telnyx Morocco DIDs** | $1/mois, inbound disponible | telnyx.com |
| **Freezvon Mobile Morocco** | $90/mois, $0/min inbound | freezvon.com |
| **WhatsApp Business Calling API** | Inbound GRATUIT, global Juillet 2025 | respond.io |
| **WhatsApp contourne VoIP blocks** | UAE/KSA/Qatar accessibles | Vérifié |
| **PSTN Morocco VIABLE** | COGS $0.044/min, marge 63% | Calculé |

#### v5.3 (27/01/2026) - Synchronisation incohérences

| Correction | Lignes | Valeur |
|------------|--------|--------|
| COGS → $0.007 | 1328, 1337, 1363 | Était $0.017 |
| Secteurs → 20 | 101, 1279 | Était 16 |
| Marge → 91% | 1365 | Était 83% |

#### v5.2 (27/01/2026) - Analyse MENA complète

| Pays analysés | Détail |
|---------------|--------|
| 11 pays MENA | Morocco, UAE, KSA, Egypt, Qatar, Kuwait, Bahrain, Oman, Jordan, Tunisia, Algeria |

#### v5.0 (27/01/2026) - Audit Exhaustif

| Ajout | Providers vérifiés | Source |
|-------|-------------------|--------|
| **LLM complet** | Grok, Claude, Mistral Saba, Atlas-Chat, Gemini | APIs officielles |
| **TTS complet** | ElevenLabs, MiniMax/fal.ai, Polly, Google, Web Speech | Pricing pages |
| **STT complet** | Scribe, Whisper, AssemblyAI, Deepgram, DVoice, Google | Pricing pages |
| **Telephony complet** | Twilio, DIDWW, Telnyx, WebRTC, Daily.co | Pricing pages |
| **Benchmark** | Retell AI, Vapi, Bland AI | Public pricing |

#### v4.0 (27/01/2026) - Corrections initiales

| Erreur v3.1 | Correction | Impact |
|-------------|------------|--------|
| STT $0.10/min | **$0.007/min** | 14x surestimé |
| TTS $0.024/min | **$0.065-0.108/min** | Sous-estimé |
| Twilio inbound | **N/A Maroc** | DIDWW requis |

### Sources Ajoutées v5.0

| Provider | URL Pricing |
|----------|-------------|
| Grok/xAI | [docs.x.ai/docs/models](https://docs.x.ai/docs/models) |
| Claude | [platform.claude.com/docs/en/about-claude/pricing](https://platform.claude.com/docs/en/about-claude/pricing) |
| Mistral Saba | [mistral.ai/news/mistral-saba](https://mistral.ai/news/mistral-saba) |
| Atlas-Chat 9B | [huggingface.co/MBZUAI-Paris/Atlas-Chat-9B](https://huggingface.co/MBZUAI-Paris/Atlas-Chat-9B) |
| Atlas-Chat 27B | [huggingface.co/MBZUAI-Paris/Atlas-Chat-27B](https://huggingface.co/MBZUAI-Paris/Atlas-Chat-27B) |
| Atlas-Chat Paper | [arxiv.org/abs/2409.17912](https://arxiv.org/abs/2409.17912) |
| Gemini | [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| fal.ai MiniMax | [fal.ai/models/fal-ai/minimax/speech-2.6-turbo](https://fal.ai/models/fal-ai/minimax/speech-2.6-turbo) |
| Amazon Polly | [aws.amazon.com/polly/pricing](https://aws.amazon.com/polly/pricing/) |
| AssemblyAI | [assemblyai.com/pricing](https://www.assemblyai.com/pricing) |
| Deepgram | [deepgram.com/pricing](https://deepgram.com/pricing) |
| DVoice | [huggingface.co/speechbrain/asr-wav2vec2-dvoice-darija](https://huggingface.co/speechbrain/asr-wav2vec2-dvoice-darija) |
| Daily.co | [daily.co/pricing](https://www.daily.co/pricing/) |

### Sources MENA Telephony v5.2 (27/01/2026)

| Pays/Provider | Source |
|---------------|--------|
| **UAE Twilio** | [twilio.com/en-us/sip-trunking/pricing/ae](https://www.twilio.com/en-us/sip-trunking/pricing/ae) |
| **KSA Twilio** | [twilio.com/en-us/sip-trunking/pricing/sa](https://www.twilio.com/en-us/sip-trunking/pricing/sa) |
| **Qatar Twilio** | [twilio.com/en-us/sip-trunking/pricing/qa](https://www.twilio.com/en-us/sip-trunking/pricing/qa) |
| **Egypt Twilio** | [twilio.com/en-us/sip-trunking/pricing/eg](https://www.twilio.com/en-us/sip-trunking/pricing/eg) |
| **DIDWW Coverage** | [didww.com/coverage-and-prices/coverage](https://www.didww.com/coverage-and-prices/coverage) |
| **DIDWW KSA** | [didww.com/voice/global-sip-trunking/Saudi_Arabia](https://www.didww.com/voice/global-sip-trunking/Saudi_Arabia) |
| **DIDWW Egypt** | [didww.com/voice/global-sip-trunking/Egypt](https://www.didww.com/voice/global-sip-trunking/Egypt) |
| **DIDWW Algeria** | [didww.com/voice/global-sip-trunking/Algeria](https://www.didww.com/voice/global-sip-trunking/Algeria) |
| **CommPeak GCC** | [commpeak.com/local-presence/did-gcc](https://www.commpeak.com/local-presence/did-gcc/) |
| **Etisalat UAE** | [etisalat.ae/en/enterprise-and-government/enterprise-solutions/unified-communications.html](https://www.etisalat.ae/en/enterprise-and-government/enterprise-solutions/unified-communications.html) |
| **du SIP Trunk** | [du.ae/siptrunk](https://www.du.ae/siptrunk) |
| **STC KSA SIP** | [stc.com.sa/content/stc/sa/en/business/connect/fixed-voice/sip-extension.html](https://www.stc.com.sa/content/stc/sa/en/business/connect/fixed-voice/sip-extension.html) |
| **Ooredoo Qatar** | [ooredoo.qa/web/en/business/sip-t](https://www.ooredoo.qa/web/en/business/sip-t/) |
| **Vodafone Qatar** | [vodafone.qa/en/business/services/fixed/sip-t](https://www.vodafone.qa/en/business/services/fixed/sip-t/) |
| **Ooredoo Kuwait** | [ooredoo.com.kw/portal/en/b2bOffConnSIPTrunkServices](https://www.ooredoo.com.kw/portal/en/b2bOffConnSIPTrunkServices) |
| **Telecom Egypt** | [te.eg/wps/portal/te/Business/Voice-Services/SIP-Trunk-Service](https://www.te.eg/wps/portal/te/Business/Voice-Services/SIP-Trunk-Service) |
| **UAE VoIP Law** | [frejun.com/are-voip-calls-allowed-in-uae](https://frejun.com/are-voip-calls-allowed-in-uae/) |
| **MENA VoIP Challenges** | [istizada.com/blog/telecommunication-voip-challenges-in-the-middle-east](https://istizada.com/blog/telecommunication-voip-challenges-in-the-middle-east/) |
| **WhatsApp Bans** | [cloudwards.net/countries-where-whatsapp-is-banned](https://www.cloudwards.net/countries-where-whatsapp-is-banned/) |
| **Omantel SIP** | [tmcnet.com/channels/virtual-pbx/articles/415335](https://www.tmcnet.com/channels/virtual-pbx/articles/415335-omantel-launches-sip-trunking-large-enterprises.htm) |
| **DID Logic GCC** | [didlogic.com](https://didlogic.com/) |
| **Plivo UAE** | [plivo.com/sip-trunking/coverage/ae](https://www.plivo.com/sip-trunking/coverage/ae/) |
| **Telnyx Global** | [telnyx.com/global-coverage](https://telnyx.com/global-coverage) |

#### v5.2 (27/01/2026) - Analyse MENA Complète

| Ajout | Contenu | Impact |
|-------|---------|--------|
| **11 pays MENA** | UAE, KSA, Egypt, Qatar, Kuwait, Bahrain, Oman, Jordan, Tunisia, Algeria, Morocco | Couverture exhaustive |
| **Opérateurs locaux** | Etisalat, du, STC, Ooredoo, Vodafone, Batelco, Omantel, Telecom Egypt | B2B SIP |
| **Providers intl** | Twilio, DIDWW, Telnyx, CommPeak, AVOXI, DID Logic, Plivo | Couverture comparée |
| **Réglementation VoIP** | UAE/KSA/Qatar restrictif, Maroc/Tunisie/Bahrain ouvert | Impact stratégique |
| **Conclusion** | WebRTC-first = seule stratégie uniformément viable MENA | Priorité confirmée |
| Retell AI | [retellai.com/pricing](https://www.retellai.com/pricing) |
| Vapi | [vapi.ai/pricing](https://vapi.ai/pricing) |
| Bland AI | [docs.bland.ai/platform/billing](https://docs.bland.ai/platform/billing) |
