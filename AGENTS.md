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
- Keep the imported public roster in a static data file and clearly distinguish demonstration match history; no writes go to the original site.
- Keep team-organization demo state in React memory until persistent administration is requested, so a visual prototype never implies saved changes.
