# The typefaces, and what may be done with them

Four faces ship in this directory. Three are free to embed; one is not, and
the difference matters before a store build.

## Open Font License — free to embed

| Face | Copyright | Licence |
| --- | --- | --- |
| Cormorant Garamond | 2015 the Cormorant Project Authors ([CatharsisFonts/Cormorant](https://github.com/CatharsisFonts/Cormorant)) | [OFL-CormorantGaramond.txt](OFL-CormorantGaramond.txt) |
| Jost | 2020 The Jost Project Authors ([indestructible-type](https://github.com/indestructible-type)) | [OFL-Jost.txt](OFL-Jost.txt) |
| Sacramento | 2012 Brian J. Bonislawsky DBA Astigmatic (AOETI), with Reserved Font Name 'Sacramento' | [OFL-Sacramento.txt](OFL-Sacramento.txt) |

SIL Open Font License 1.1 permits embedding in an application and
redistribution, including commercially, provided the notice above travels
with the files — which is what this directory is for. The licence texts are
verbatim from `google/fonts`, not retyped.

**What was done to the files, which the licence cares about.** Cormorant and
Jost ship here as their variable fonts, axis-clipped with
`fonttools varLib.instancer` and subsetted to `latin` and `latin-ext` with
`pyftsubset`. That is a modification, and the OFL permits it — neither of
those two carries a Reserved Font Name, so there is nothing to rename.

Sacramento is the one that does carry an RFN, and it is the one that has not
been touched: those two files are Google's own subsets, byte for byte as
served from `fonts.gstatic.com`. A Modified Version could not have kept the
name; an unmodified copy keeps it correctly.

To rebuild any of them, the sources are the upstream TTFs from Google Fonts,
clipped to `wght=300:400` for Cormorant and `wght=300:600` for Jost — the
ranges `css/styles.css` declares.

## PP Hatton — check before you ship

`hatton-ultralight.woff2` and `hatton-medium.woff2` are **Pangram Pangram**,
a commercial foundry. That is a different situation from the three above and
it has not been verified here.

Foundry licences routinely price and permit *web* use and *app embedding*
separately, and a webfont licence commonly does **not** cover a font file
shipped inside an App Store or Play binary. The web build has always served
these two files; a store build embeds them, which may be a use the current
licence does not grant.

**Confirm the Hatton licence covers app embedding before the first store
upload.** If it does not, the options are to buy the app licence, or to
change `--display` — and the second is expensive, because the display face
carries the wordmark, the splash and every heading in the app.
