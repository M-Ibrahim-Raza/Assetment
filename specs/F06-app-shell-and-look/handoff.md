# F06 – App shell and look

**What:** the frame around every signed-in screen: the five places (Home, Spending, Add, Portfolio, Debts), a tab bar on phones and a sidebar from tablet width up, and a header with Hide amounts and the profile panel. Also toasts, and the look in light and dark.

**Screens:** `/dashboard`

**Decisions:** Rounded blocks (variant D) won over Calm Ledger, Midnight and Colour block: one big net worth number and answer headlines on rounded colour blocks read best. Bottle green, sage and ink on a mist page.

**Edge cases:**

- Add is raised in the phone tab bar, and it's the only primary button in view. Toasts sit above the tab bar.
- The sidebar shows the full logo when open, and only the A on the collapsed rail. The rail keeps small names under its icons, so it works on touch.
- The sidebar toggles with its edge handle or Ctrl/⌘ + B. Tablets start collapsed and desktops open, until the user chooses. The browser remembers the choice.
- The profile panel switches Auto, Light or Dark, and the colour theme (F22). Auto and Green are the defaults. Both apply before the first paint, so a reload doesn't flash the wrong look. Settings and Sign out are stand-ins.
- Dark is "Green night". Text on dark backgrounds is white.
- Colour themes (F22): Green, Ocean, Indigo, Plum, Rose, Clay and Slate, as named swatches under Auto, Light and Dark. A tap applies one at once, with no Save. Each has a day and a night set of the same tokens. Gain, loss and delete red stay the same in all of them. `node prototypes/kit/contrast.mts` checks every theme against AA.
- The colour is saved to the user's profile, so it follows them to every device. Light, Dark and Auto stay per device. A cookie copy, read by the pre-paint script, stops a reload flashing Green.
- The phone's browser bar takes the page colour of the current theme and mode.
- Sign up and sign in show the colour saved on the device.
- At night, link buttons use the theme's pale accent text (`accent-foreground`), not `primary`, which is about 2:1 on dark blocks. It's the one exception to white text on dark backgrounds.
- The look in numbers: 24 px corners, 12 px gaps, Bricolage Grotesque headings, and page titles in Fraunces, the logo's serif (weight 650, Soft 100).
- Open: on phones, the green top block still shows "Assetment" as typed text. The logo's gold A would be only 2:1 on that green.
