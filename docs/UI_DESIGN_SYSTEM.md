# Client appearance and interaction rules

The existing brand palette is retained. Dark values are semantic counterparts of its forest green, cream and gold, not a separate brand. Backend contracts and business policies are unchanged.

| Meaning            | Web Light                    | Web Dark  | Native token                    |
| ------------------ | ---------------------------- | --------- | ------------------------------- |
| Page               | `--paper` `#f7f3e9`          | `#101d19` | `cream` (`#faf6ed` / `#101d19`) |
| Raised surface     | `--surface` `#fffdf7`        | `#182b24` | `paper` (`#fffdf8` / `#182b24`) |
| Primary text       | `--ink` `#18342c`            | `#f7f3e9` | `ink`                           |
| Secondary text     | `--muted` `#465e55`          | `#bbcec2` | `muted`                         |
| Action             | `--green` `#10554c`          | `#9ad5b8` | `green`                         |
| Action text        | `--on-action`                | `#10291f` | `onAction`                      |
| Decorative divider | `--line`                     | `#3a5146` | `line`                          |
| Form boundary      | `--control-border` `#7e9186` | `#789387` | `control`                       |
| Focus              | `--focus`                    | `#efc879` | `focus`                         |
| Error              | `--error`                    | `#ffc2af` | `error`                         |

Keep native's original slightly different Light neutrals. Use tokens for new surfaces, text, controls and feedback; do not import the legacy static `theme.ts` color object into new screen components. Static design assets and typography remain in `theme.ts`. Preserve multicolor brand artwork; tint monochrome navigation symbols with the current palette.

## Web

`src/lib/appearance.ts` is safe to import from the server layout. Its small pre-body script applies `dukkan-appearance` before painting. The client picker uses `light`, `dark` or `system`, responds to OS and cross-tab changes and stores only the preference. No session data enters that script or local storage. Keep CSS's OS fallback for unavailable storage. Native HTML form/video controls receive the appropriate `color-scheme`.

Use logical CSS properties and the locale's document direction. Mixed email/password values remain LTR. Form labels persist; errors are associated with controls, and validation focuses the first invalid field. A server rejection preserves entered values. Keep security-sensitive session handling in the existing server actions and HttpOnly cookies.

Journey selection uses actual buttons and tabs with roving focus. Arrow direction respects RTL; Home/End work. Motion must be removable through `prefers-reduced-motion`. Video is never preloaded or played before an explicit visitor action. A missing source has no play control.

## Native

`AppearanceProvider` surrounds the session tree so the preference survives login/logout. `useAppearance()` supplies palette/mode; `themedStyles(factory)` creates memoized StyleSheet hooks. Preference uses Expo SecureStore key `dukkan.appearance`; System listens to `useColorScheme()`. The existing Expo Router splash API holds initial rendering until fonts and preference are ready. The stack background and status bar use the resolved mode. A storage error is visible in the appearance picker rather than silently reporting persistence.

Use shared `Page`, `Card`, `Copy`, `Field` and `Button` primitives. Keep safe areas, minimum touch targets, scrollable content and keyboard avoidance. Do not impose fixed text container heights or disable font scaling to fit a screen. The keyboard hides bottom navigation while forms remain scrollable. Registration and recovery modes handle Android hardware Back by returning to sign-in; Back first dismisses an open keyboard/modal through native behavior.

Appearance choices expose radio semantics and checked state. Field labels, hints and errors are available in the native accessibility tree. Respect the OS reduce-motion setting for modal and stack transitions. This implementation still needs human TalkBack/VoiceOver and standalone release-device review; see the [verification report](UI_UPGRADE_VERIFICATION.md).

The appearance chooser uses a native modal with app-owned colors and no transition animation. Choices are staged: **Done** closes it and applies/stores the preference; Back cancels. The provider reads the OS preference for System without forcing Android's native UI-mode configuration. Payment confirmations use the shared themed `ConfirmDialog`, preserving the existing backend snapshot amounts and payment callbacks; iOS fields receive `keyboardAppearance`. Native navigator options stay stable across palette changes. These choices do not establish a fix for the reproduced Android font/theme Fabric failure; see UI-01 in the verification report.
