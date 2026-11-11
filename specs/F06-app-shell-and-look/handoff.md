# F06 – App shell and look

**What:** the frame around every signed-in screen: the five places (Home, Spending, Add, Portfolio, Debts), a tab bar on phones and a sidebar from tablet width up, and a header with Hide amounts and the profile panel. Also toasts, and the look in light and dark.

**Screens:** `/dashboard`

**Decisions:** Rounded blocks (variant D) won over Calm Ledger, Midnight and Colour block: one big net worth number and answer headlines on rounded colour blocks read best. Bottle green, sage and ink on a mist page.

**Edge cases:**

- Add is raised in the phone tab bar, and it's the only primary button in view. Toasts sit above the tab bar.
- The sidebar shows the full logo when open, and only the A on the collapsed rail. The rail keeps small names under its icons, so it works on touch.
- The sidebar toggles with its edge handle or Ctrl/⌘ + B. Tablets start collapsed and desktops open, until the user chooses. The browser remembers the choice.
- The profile panel switches Auto, Light or Dark. Auto is the default. The theme applies before the first paint, so a dark reload doesn't flash light. Settings and Sign out are stand-ins.
- Dark is "Green night". Text on dark backgrounds is white.
- The look in numbers: 24 px corners, 12 px gaps, Bricolage Grotesque headings.
- Open: on phones, the green top block still shows "Assetment" as typed text. The logo's gold A would be only 2:1 on that green.
