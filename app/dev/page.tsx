import { notFound } from 'next/navigation';

import { DevKitchenSink } from './_components/DevKitchenSink';

// Manual QA gallery for every UI primitive (see skills/component-builder/SKILL.md).
// Not for production — kept out with a server-side guard rather than an
// underscore-prefixed folder, since app/_dev/ is a Next.js "private folder"
// convention that's excluded from routing entirely (verified: it never
// builds a route at all, in any environment) and would make this page
// unreachable even in development.
export default function DevPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <DevKitchenSink />;
}
