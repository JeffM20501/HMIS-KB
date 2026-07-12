// Your DRF UserSerializer almost certainly returns first_name/last_name
// separately (Django's default User model shape), but the UI was built
// around a single `name` + 2-letter `avatar` initials for display. Rather
// than touch every component, normalize once here at the API boundary.
//
// ASSUMPTION: adjust the field names below (first_name/last_name/is_active)
// if your UserSerializer names them differently.
export function normalizeUser(raw) {
  if (!raw) return raw;
  const initials = (raw.email?.[0] );

  return {
    ...raw,
    name: raw.username,
    avatar: initials.toUpperCase(),
    role: raw.role ?? "viewer",
    isActive: raw.is_active ?? raw.isActive ?? true,
  };
}

export function normalizeUserList(list) {
  return (list ?? []).map(normalizeUser);
}
