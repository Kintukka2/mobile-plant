# The planner walkthrough — all 11 steps

The animation behind **Watch me build one**, offered on an empty plan. It
builds a sample flat and names each part as it appears, in the order a
reader would meet it.

The words below are read out of `js/tour.js` rather than retyped, so this
cannot drift from what the app says.

Two recordings exist. `planner-walkthrough.mp4` beside this file is the
overlay captured as it runs in the app, portrait and silent. The produced
one — 16:9, 1080p, with the plan and the step copy side by side — is the one
on the marketing site, at `site/video/planner-walkthrough.mp4` and `.webm`,
and it is the better thing to show anyone.

It runs on its own canvas and touches nothing in the store: the sample flat
lives in that file and goes away with the overlay. Watching costs a reader
nothing, and abandoning it half way leaves no rooms behind.

Total run **41.8 s**. Every step also has Back, Next and Skip; space bar
pauses, and the arrow keys step. Times below are measured from the start of
step 1 — the recording joins about 0.4 s in, once the splash has cleared.

| # | Step | Starts | Holds | What it says |
| --- | --- | --- | --- | --- |
| 1 | The grid | 0:00.0 | 2.2 s | Every square is half a metre. Draw your rooms at the size they really are and the readings that follow will mean something. |
| 2 | Trace a room | 0:02.2 | 4.2 s | Drag a box, or tap corner to corner for any shape. I'll snap what you draw to the grid as you go. |
| 3 | Name it | 0:06.4 | 3 s | Open a room and its heading is the name. Type over it and the plan keeps up with you. |
| 4 | The rest of the flat | 0:09.4 | 4.2 s | Keep going until the whole floor is down. Rooms that share a wall should share an edge, which is what lets light cross between them later. |
| 5 | One real size | 0:13.6 | 3.8 s | Measure one room and I'll scale the others from it. They all sit on the same grid, so a single width is enough. |
| 6 | Windows | 0:17.4 | 4.6 s | Tap a wall to cycle it: wall, then window, then opening. A window is the only way daylight gets into a room. |
| 7 | Which way is north | 0:22.0 | 4.2 s | Turn the dial until N points the way north is at your place. Until it's confirmed I leave every room unshaded rather than guess at it. |
| 8 | Doorways | 0:26.2 | 4 s | An opening lets a room borrow light from the one next door, one step dimmer. Light crosses a single doorway, never a chain of them. |
| 9 | Outdoors | 0:30.2 | 3.4 s | Tick a balcony as outdoors and every side with nothing built beyond it opens to the sky, so there are no windows to mark. |
| 10 | Where a plant should stand | 0:33.6 | 4.8 s | Drop a plant in and I'll shade the whole floor by how well each square suits it. The greenest one is where I'd put it. |
| 11 | That is a home, read for light | 0:38.4 | 3.4 s | Each room's reading feeds the watering of everything standing in it, and I'll say so when a plant is in the wrong place. Your turn. |

---

## The steps in full

### Step 1 of 11 — The grid

**0:00.0**, held for 2.2 seconds.

> Every square is half a metre. Draw your rooms at the size they really are and the readings that follow will mean something.

### Step 2 of 11 — Trace a room

**0:02.2**, held for 4.2 seconds.

> Drag a box, or tap corner to corner for any shape. I'll snap what you draw to the grid as you go.

### Step 3 of 11 — Name it

**0:06.4**, held for 3 seconds.

> Open a room and its heading is the name. Type over it and the plan keeps up with you.

### Step 4 of 11 — The rest of the flat

**0:09.4**, held for 4.2 seconds · chapter mark: *The rest of it*.

> Keep going until the whole floor is down. Rooms that share a wall should share an edge, which is what lets light cross between them later.

### Step 5 of 11 — One real size

**0:13.6**, held for 3.8 seconds.

> Measure one room and I'll scale the others from it. They all sit on the same grid, so a single width is enough.

### Step 6 of 11 — Windows

**0:17.4**, held for 4.6 seconds.

> Tap a wall to cycle it: wall, then window, then opening. A window is the only way daylight gets into a room.

### Step 7 of 11 — Which way is north

**0:22.0**, held for 4.2 seconds · chapter mark: *North*.

> Turn the dial until N points the way north is at your place. Until it's confirmed I leave every room unshaded rather than guess at it.

### Step 8 of 11 — Doorways

**0:26.2**, held for 4 seconds.

> An opening lets a room borrow light from the one next door, one step dimmer. Light crosses a single doorway, never a chain of them.

### Step 9 of 11 — Outdoors

**0:30.2**, held for 3.4 seconds.

> Tick a balcony as outdoors and every side with nothing built beyond it opens to the sky, so there are no windows to mark.

### Step 10 of 11 — Where a plant should stand

**0:33.6**, held for 4.8 seconds · chapter mark: *A plant’s place*.

> Drop a plant in and I'll shade the whole floor by how well each square suits it. The greenest one is where I'd put it.

### Step 11 of 11 — That is a home, read for light

**0:38.4**, held for 3.4 seconds · chapter mark: *Done*.

> Each room's reading feeds the watering of everything standing in it, and I'll say so when a plant is in the wrong place. Your turn.

---

## Why the order is the order

The grid comes first because half a metre per square is what makes every
later reading mean something. Windows come before north because a window
with no bearing is still a window, while a bearing with no windows says
nothing. And the plant comes last, because it is the only step that needs
all the others to have happened.
