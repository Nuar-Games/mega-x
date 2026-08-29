# MEGA-X Audio System Design

## Goal
Add lightweight, original arcade-fighter audio to MEGA-X without changing game rules, networking, or authoritative match state.

## Architecture
Audio is isolated in `src/audio.ts` and bootstrapped once from `src/main.tsx`. It observes the rendered UI to decide whether the player is in the lobby or a match, so no gameplay state mutation is required.

The system uses browser Web Audio for original synthesized SFX and looping music, and browser Speech Synthesis for the announcer voice. No copyrighted game audio is copied and no external audio files are required.

## Channels
- **Music:** separate generated lobby and match sequences.
- **SFX:** UI click, card interaction, attack, pass, blocked attack, and audio-ready cues.
- **Voice:** announcer cues including `FIGHT!`, `ATTACK!`, `PASS!`, `SERANGAN DISEKAT!`, round calls, match-over, and win calls.

## Browser behavior
Audio unlocks only after the first pointer or keyboard gesture to comply with autoplay restrictions. A fixed compact audio control opens Music/SFX/Voice sliders plus mute. Settings persist in local storage.

## Scene switching
`.duel-shell` has priority and selects match music. Lobby selectors select lobby music. No recognized scene means music is silent.

## Safety and isolation
Audio failures must never block gameplay. The module has no Supabase calls, no match-action calls, no state writes, and no dependency on authoritative engine data.

## Verification
`tests/audio_system_regression.mjs` gates the bootstrap import, Web Audio engine, speech synthesis announcer, controls, both music sequences, and PASS cue. TypeScript compilation remains part of the existing build gate.
