# sproutevergreen.com

The landing page and the privacy policy. Two static files, one stylesheet and
the four typefaces — no build step here either.

```
site/
  index.html     the landing page
  privacy.html   the policy both stores require; Play has this URL
  site.css       shared by both, so they cannot drift apart
  fonts/         a copy of css/fonts/, see below
  _headers       security headers and cache policy
```

## Why the fonts are duplicated

`site/fonts/` is a byte copy of `css/fonts/`. It exists because a Cloudflare
Pages project can only publish files inside its own root directory, and this
directory is the root of the `.com` project — it cannot reach `../css/fonts/`.

The alternative was loading the three open faces from Google Fonts, which is
the arrangement the app spent a release removing. A privacy page that tells
you Sprout contacts one host, while itself contacting another to draw its own
heading, is not a page worth publishing.

**Replace a face in one place and replace it in the other in the same commit.**
Nothing enforces this; the copies are identical today and a diff will tell you
if they stop being.

```bash
diff -r css/fonts site/fonts && echo "fonts in sync"
```

## Why there is no _redirects file

There was one, for a day, and it broke the policy page in production.

Cloudflare Pages already serves `privacy.html` at `/privacy`, and redirects
`/privacy.html` to `/privacy` to keep one canonical URL. That behaviour is on
by default and cannot be turned off. A `_redirects` line reading
`/privacy  /privacy.html  301` therefore sent `/privacy` to `/privacy.html`,
which the host sent straight back to `/privacy`:
**ERR_TOO_MANY_REDIRECTS**, on the one page both app stores require.

So the links here are written extensionless — `href="privacy"` — and the URL
given to Play is `https://sproutevergreen.com/privacy`. Nothing redirects at
all. `.claude/serve.js` resolves an extensionless path the same way, so a
local check exercises the same URL a visitor gets; it did not before, which
is how the loop got as far as production.

## Deployment

Two Cloudflare Pages projects from this one repository. Both have **no build
command** — they publish the directory as it stands.

| Project | Root directory | Domain |
| --- | --- | --- |
| `sprout-app` | `/` | `sproutevergreen.app` |
| `sprout-site` | `site` | `sproutevergreen.com` |

Every push to `main` redeploys both. A push to any other branch gets a preview
URL and leaves the live sites alone, which is what makes a pull request worth
opening for a copy change.

### Setting them up

In the Cloudflare dashboard, once per project:

1. **Workers & Pages → Create → Pages → Connect to Git**, and pick
   `Kintukka2/mobile-plant`.
2. **Project name** — `sprout-app` or `sprout-site`.
3. **Production branch** — `main`.
4. **Framework preset** — *None*. **Build command** — leave empty.
5. **Build output directory** — `/` for the app, `site` for the site.
6. Save and Deploy. It finishes in under a minute; the first URL is
   `<project>.pages.dev`.
7. **Custom domains → Set up a custom domain.** Because both domains are on
   Cloudflare already, the DNS record is created for you and the certificate
   issues within a few minutes.

Add `www.sproutevergreen.com` as a second custom domain on `sprout-site` if
you want it; Cloudflare will serve both and you can redirect one to the other
from **Rules → Redirect Rules**.

### The one thing to get right on the app project

`.app` is on the HSTS preload list, so it is HTTPS-only in every browser with
no fallback. Cloudflare Pages serves TLS by default, so this needs nothing
done — it is worth knowing only because a misconfigured host would not fail
with a warning, it would fail with a site that cannot load at all.

## Checking a deploy

The landing page is static and has no scripts, so the useful check is that the
fonts arrived and the policy is reachable:

```bash
node .claude/serve.js     # → http://localhost:8787/site/
```

Headings in Hatton rather than Didot or Times means `site/fonts/` is being
found. Then follow **Read the privacy policy** and confirm it looks like the
same site rather than the app.
