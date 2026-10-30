<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application architecture
- Share navigation, avatars, player profiles and football identity in a common football UI module so statistics and team pages remain consistent.
- Store the live roster and match history in Cloud, retaining the original import only as an archive and labeling demonstration matches; no writes go to the original site.
- Authorize every write with a server-verified encrypted shared-password session, using versioned sessions and a private password hash so visitors remain read-only and password changes revoke older access.
- Keep the version-signed Direction fallback token in sessionStorage, refreshing it on password change and clearing it on logout; browser storage helpers use SSR-safe filenames and guarded function bodies so iframe access also works after deployment.
- Share Cloud football data through one query-backed provider with revision checks to prevent stale edits from overwriting newer changes.

- Reuse one shared admin-dialog provider for login and editing inside the public statistics/team pages, so administration never becomes a separate navigation tab.
- Define the admin context and consumer hook in a UI-independent module so hot refresh preserves context identity and avoids circular provider imports.
- Keep dated attendance records and an explicit imported baseline in each player payload; replay records chronologically through one shared helper so corrections remain reversible and month boundaries never reset frequency.
- Render match-result artwork deterministically in the browser using Canvas and shared brand tokens, with the same canvas for preview and PNG export; no AI call or data write is needed.
- Reuse a shared lineup editor in match registration and roster editing, keeping team selection mutually exclusive so both flows use the same interaction and cannot duplicate players.
