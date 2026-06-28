# Open item: "AlignCraft" brand credit

Earlier in this project, a request was made to "mention product by AlignCraft" somewhere in
the platform. This was never clarified, and no verifiable AlignCraft product, design system,
or company was identified as relevant to this build — so nothing was added under that name to
avoid fabricating an attribution.

If this refers to one of the following, here's where it would go once specified:

- **A design system or component library** → note it in `docs/PHASE_1_ARCHITECTURE.md` §5 (UI
  / Design System Direction) and credit it in `apps/web/src/styles/index.css` as a comment.
- **A partner or vendor credit** → add to the footer in `apps/web/src/components/layout/Footer.jsx`,
  and to the `<head>` metadata in `apps/web/index.html` if it should appear in page metadata.
- **A client/agency name for the project itself** → add to the root `README.md` header and to
  `package.json`'s `author` field in both `apps/api/package.json` and `apps/web/package.json`.

Delete this file once resolved.
