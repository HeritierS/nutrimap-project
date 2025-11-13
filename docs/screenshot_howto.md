# Screenshot How-to (Windows)

This short guide explains how to capture the screenshots requested in Chapter 4 and where to place them.

1. Recommended resolution
- Use 1280×800 or larger for clarity in the report and slides.

2. Capture methods (Windows)
- Full screen: press `PrtScn` to copy the entire screen to the clipboard. Open Paint and press `Ctrl+V`, then save as PNG.
- Active window: press `Alt+PrtScn` to copy the active window to the clipboard.
- Snip & Sketch (Windows 10/11): press `Win+Shift+S` and drag to select a region. The image is copied to the clipboard and shows a notification to open and save.

3. Recommended filenames and where to save
- Save images in the repository under `docs/images/` with these filenames:
  - `screen_login.png`
  - `screen_dashboard.png`
  - `screen_children_list.png`
  - `screen_new_child.png`
  - `screen_child_detail.png`
  - `screen_map_view.png`
  - `screen_admin_users.png`

4. Image format
- Use PNG for screenshots. Keep file sizes reasonable (compress if necessary) but preserve legibility.

5. Example: saving a successful login screenshot
- Log in on the frontend (localhost or deployed URL).
- Capture the login form and successful redirect to the dashboard.
- Save as `docs/images/screen_login.png` and include a 1-2 line caption in the report.

6. Adding images to the report
- In `docs/chapter4_system_implementation_and_testing.md` you can reference images using Markdown:

```markdown
![Login screen](./images/screen_login.png)
```

7. Privacy
- Do not include real patient or personally-identifying data in screenshots. Use demo accounts created by the seed script.
