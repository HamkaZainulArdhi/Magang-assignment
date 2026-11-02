import { z } from "zod";

const indonesian = z.locales.id();

// Indonesian locale covers generic Zod errors; the explicit schema messages
// below make the common API validation errors more natural.
z.config({
  ...indonesian,
  localeError(issue) {
    if (issue.code === "unrecognized_keys") {
      return `Field tidak dikenal: ${issue.keys.join(", ")}`;
    }
    return indonesian.localeError(issue);
  },
});

export { z };
