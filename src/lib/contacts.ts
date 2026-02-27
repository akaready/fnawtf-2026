/** Full display name from first + last name fields. */
export function contactFullName(c: { first_name: string; last_name: string }): string {
  return `${c.first_name} ${c.last_name}`.trim();
}
