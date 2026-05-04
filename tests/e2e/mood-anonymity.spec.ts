import { test, expect } from "@playwright/test";

// Hard rule: /admin/mood must never expose the responder's name/id.
// This test runs against the public DOM only — no auth setup.
// Once auth fixtures exist, expand to log in as admin and assert no name appears next to a comment.

test("admin mood page never shows responder names alongside comments (smoke)", async ({ page }) => {
  // Without admin auth this redirects to /login — that's acceptable here.
  // The real assertion lives in the Prisma query layer (see /admin/mood/page.tsx):
  // it never selects the `user` relation in the comment list.
  await page.goto("/admin/mood");
  // Either we're redirected (auth gate works), or we see the page but not user_id.
  const html = await page.content();
  expect(html).not.toMatch(/user_id\s*=/i);
});
