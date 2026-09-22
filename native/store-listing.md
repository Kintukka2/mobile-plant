# Play Store listing

Copy ready to paste, with the character limits that matter. Everything here
describes what the code actually does — the claims are the same ones
`native/store-privacy.md` makes to the Data safety form, deliberately, so a
reviewer reading both finds one story.

## App name — 29 / 30

```
Sprout Evergreen — Plant Care
```

Brand first, then the words a stranger types. There are already several
plant apps called some variant of Sprout, so the second word is doing real
work; "Plant Care" is what makes the listing findable at all.

## Short description — 78 / 80

```
Plant care schedules built from real species data, your pots and your weather.
```

Play shows this under the title in search results and it is weighted for
ranking, so it carries the three nouns the app is actually about rather than
an adjective.

## Full description — 2,211 / 4,000

```
Most plant apps ask how often you want reminding. Sprout works it out.

Every schedule starts from real data for the species — 48 of the most common
houseplants, each with its own warm and cool season watering intervals,
feeding cycle, ideal light and toxicity. Then it adjusts for your situation:
pot size and material, drainage, how bright the room is, which way the window
faces, and what season it is where you live. A Monstera in a 24cm terracotta
pot by a north window is not on the same cycle as one in plastic in a dim
corner, and Sprout does not pretend otherwise.

WEATHER THAT CHANGES THE PLAN
Set a location and Sprout reads the local forecast. Before a hot dry spell it
offers to bring watering forward; before a wet week it offers to hold off.
You approve every change.

A CLINIC FOR WHEN SOMETHING LOOKS WRONG
Yellow leaves, brown tips, sudden drop, fungus gnats. Pick the symptom,
answer a few questions about what else you are seeing, and Sprout ranks the
likely causes — 26 symptoms, 42 clues and 40 causes, weighted by what your
particular species is prone to. Each cause comes with what to do about it.

YOUR HOME, NOT A LIST
Group plants into rooms tagged by light and window aspect. Draw your actual
floor plan if you like, and Sprout works out which rooms are bright, which
are dim, and which borrow light through a doorway.

A RECORD WORTH KEEPING
Every plant gets a diary and a growth chart. Photos, measurements,
milestones, repottings, problems. Watch a cutting become a plant.

TOXICITY, STATED PLAINLY
Tell Sprout you have cats, dogs or other pets and it flags what is dangerous
to them, rated separately for each — because the same plant is not equally
risky to a cat, a dog and a toddler.

ONE REMINDER, ONLY WHEN IT MATTERS
At most one notification a day, and only on days something is actually due.
Nothing due, nothing from Sprout.

NO ACCOUNT. NO ADS. NO TRACKING.
There is no sign-up, no server and no analytics. Your plants, photos, diary
and schedule live on your phone and are never uploaded. The only thing that
ever leaves is an approximate location — rounded to about a kilometre — sent
to the weather service to fetch your forecast. Nothing else, ever.

Works offline.
```

## Screenshots

Five, in `store-assets/screenshots`, in the order they should be uploaded:
Today, Greenhouse, a plant, Discover, Diagnose. Real screens with seeded
data, not mockups — what is in them is what the app draws.

All are 1080x1920, 24-bit PNG with **no alpha channel**, which Play rejects.
Play wants a minimum of two and allows eight, with every side between 320
and 3840 and the long side no more than twice the short.

Regenerate them after a UI change with `.claude/seed.html`; the command and
the reasons behind its odd numbers are in the comment at the top of it.

## Category and tags

- **Category** — Lifestyle. House & Home is the alternative; Lifestyle is
  where the established plant apps sit, so it is where people browse.
- **Tags** — gardening, plants, home, reminders, hobbies.
- **Contact email** — needs a real address. Use one on the domain, such as
  `privacy@sproutevergreen.com` forwarded wherever you like. It is published
  on the listing, so it should not be a personal or work address.
- **Website** — `https://sproutevergreen.com`
- **Privacy policy** — `https://sproutevergreen.com/privacy.html`, which is
  the page in this repository at `privacy.html`. It has to be live before
  the listing can be submitted.

## Content rating questionnaire

Play uses IARC. Answer **no** to all of: violence, sexuality, profanity,
controlled substances, gambling, simulated gambling, user interaction,
sharing location with other users, personal information sharing, digital
purchases. There is no user-generated content and no way for users to
contact each other, so the whole interactive block is no.

Expected outcome: **Everyone / PEGI 3 / rated for all ages.**

## Target audience and content

- **Target age** — 18 and over, or 13+. Not children. The app is not designed
  for or appealing to children, so keep every under-13 box unticked; ticking
  one pulls the listing into the Families programme and a much heavier
  policy review for no benefit.
- **Ads** — **No**, the app contains no ads. This is asked separately from
  Data safety and is checked against the binary.
- **App access** — all functionality is available without an account. Say so;
  leave the credentials fields empty.
- **Government app** — no. **Financial features** — none. **Health** — no,
  the app makes no health claims about people.
