# MEGA X — Canonical Project State

Last updated: 2026-09-14

## Purpose
This file is the durable source of truth for project continuity. Before giving implementation-specific advice about Mega X, inspect the current repository/build first and use this file as context. Do not rely on conversational memory alone.

## Live product
- Project: Mega X browser TCG
- Repository: Nuar-Games/mega-x
- Default/live branch: `main`
- Current package version: 1.1.0
- Vercel project: `mega-x`
- Do not modify `main` unless the user explicitly asks for a live fix or players report a bug.
- Existing player data must not be wiped or reset.

## Current browser-game philosophy
- Browser Mega X is intentionally a lean, social digital card game, not a giant live-service TCG.
- A burst of a few weeks to about a month of player engagement is considered a win.
- Friend groups matter because the game is intentionally silly, chaotic, and social.
- Card releases are the main freshness mechanism.
- Initial pool: 30 cards.
- Planned expansion cadence: +5 cards per month until the intended 50-card pool is reached.
- These monthly drops are additions to the current environment, not necessarily generation-defining sets.

## Current lobby structure
The lobby ALREADY contains commercial and content areas. Do not suggest adding generic new ad boxes without inspecting the live layout.

Existing lobby areas include:
- Player area
- Fighters / player list
- Leaderboard with Top 20 treatment
- Global chat
- Live metrics: fights played, registered fighters, online now, lobby visits
- Practice entry / beginner bot
- News & Announcements
- `PARTNER SPACE / MEGA-X FEATURED PARTNER` commercial banner
- `SPONSOR / PRODUCT` showcase panel

Monetization intent:
- The existing Partner Space is the natural candidate for Google AdSense.
- The existing Sponsor/Product panel should remain available for direct sponsor or product-placement deals.
- Avoid redesigning the lobby merely to make room for ads; the room already exists.

## Monetization principles
- Sector Seven Studio rule: NO loot boxes.
- User is also tired of mystery boxes, booster-style monetization, and battle-pass treadmills.
- Browser version monetization currently considered: Google Ads plus an easy support/donation option.
- Future Unity monetization should favor direct-purchase cosmetics and earned collectibles rather than paid randomness.
- Potential collectible categories: card backs, pets, arenas, VFX/finishers, profile cosmetics.

## Card design / gameplay identity
- Mega X is intentionally chaotic and social.
- Its strength is card effects that create memorable player stories, reversals, grudges, and funny moments rather than sterile efficiency.
- Example: Black Hole removes 10 cards; White Hole returns 5 random cards from each player's Zon Tepi to the Master Deck, restoring 10 total and creating chaos.
- Example interaction discussed: SPUDUR can discard 2 cards to reach 1000 ATK, then an opponent can answer with Ular Pelari's effect; these emotionally sharp counters are desirable.
- Do not homogenize Mega X into a conventional TCG just because conventional systems are proven.

## Unity long-term direction
Unity Mega X is intended to be the uncompromised presentation version, not merely the browser game ported to Unity.

Quality target:
- Master Duel-level polish as a benchmark for presentation quality, without copying its art/UI.
- Proper 3D arenas
- Proper particles and VFX
- Card draw / hover / tilt / travel / flip / attack / destruction / fusion-or-ride style animations
- Cinematic but fast important moments
- Proper HUD redesign
- Redesigned lobby/front end
- Visible card backs as a major collectible/selling point
- Player-selectable collectible pets shown beside the arena/player side
- Player-owned arenas and presentation cosmetics
- Card album/showcase
- Strong sound design and motion throughout

## Future collectible economy concept
Design idea under consideration for the future flagship/Unity version:
- Players can receive post-battle loot for free.
- Loot has rarity.
- Items can be traded between players, but transfer can carry a fixed fee paid to Sector Seven.
- Example discussed: an Ultra Rare item could have an MYR 20 transfer fee.
- Highest-rarity drop eligibility may be tied to competitive ranking, with a special hidden rarity pool only available to Top 20 players.
- Top 20 should increase access to rare drops, never guarantee a drop.
- Match-fixing should not be treated as solved merely by rank loss; suspicious matches should eventually be ineligible for prestige drops and monitored server-side.
- No cash-out marketplace is planned at this stage.

## Studio
- Studio name: Sector Seven Studio.
- Sector Seven is not yet formally registered.
- Core studio monetization principle: no loot boxes.
- Website + YouTube preferred; user dislikes social media.

## Working rules for future assistants/chats
1. For questions about what currently exists in Mega X, inspect the actual repository/build before answering.
2. Treat this file as continuity context, not as a substitute for checking current implementation.
3. Never tell the user to add UI/space that already exists without verifying the current layout first.
4. Do not touch `main` casually.
5. Do not overwrite player data.
6. Keep answers grounded in Mega X itself, not generic game-development templates.
7. When a mistake is made, correct it directly and apologize without making the user argue for accountability.
