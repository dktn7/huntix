# Vibe Jam 2026 Portal Webring Guide

> Note: The Vibe Jam Portal webring is totally different from the required widget snippet. The widget is mandatory — portals are optional but let players hop between games like a webring.

---

## How It Works

Make an exit portal in your game that players can walk/fly/drive into (add a label like "Vibe Jam Portal"). When the player enters, redirect them to:

```
https://vibej.am/portal/2026
```

Your game will be added to the webring if you have a portal.

---

## Query Parameters (Forwarded to Next Game)

| Param | Description |
|---|---|
| `username` | Name of the player |
| `color` | Player colour (hex or name: red/green/yellow) |
| `speed` | Metres per second |
| `ref` | URL of the game the player came from |

**Example URL:**
```
https://vibej.am/portal/2026?username=levelisio&color=red&speed=5&ref=fly.pieter.com
```

### Optional Extra Params

```
avatarurl    team         hp (1–100)
speedx       speedy       speedz
rotationx    rotationy    rotationz
```

The portal redirector always adds `?portal=true` so you can detect when a user arrives from a portal and instantly drop them in — no start screens.

---

## IMPORTANT — Add a Start Portal

When receiving a user with `?portal=true` in your URL and a `?ref`, make a portal where the user spawns out of so they can return to the previous game by walking into it. When returning them, send all the query parameters again too.

> All parameters except `portal` are optional and may or may not be present — do not rely on their presence.

**Make sure your game instantly loads** — no loading screens, no input screens — so the continuity is seamless.

---

## Sample Code (Three.js)

Copy-paste-ready snippet for start + exit portals:

```html
<script src="https://vibej.am/2026/portal-sample.js"></script>
<script>
  initVibeJamPortals(scene, getPlayer, {
    spawnPoint: { x: 0, y: 0, z: 0 },
    exitPosition: { x: -200, y: 200, z: -300 }
  });

  // Inside your existing animate/render loop:
  animateVibeJamPortals();
</script>
```

---

## Required Widget (Separate — Mandatory)

```html
<script async src="https://vibej.am/2026/widget.js"></script>
```

This tracks entrants and measures popularity for the Most Popular sub-prizes. Add it to your game's HTML — games without it are **disqualified**.
