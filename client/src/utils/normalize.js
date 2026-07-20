// src/utils/normalize.js

/**
 * Check if a string is a valid Cloudinary URL
 */
export function isAvatarUrl(value) {
    if (!value) return false;
    return value.startsWith('https://res.cloudinary.com/');
}

/**
 * Generate initials from a name string (max 2 characters)
 */
export function getInitials(name) {
    if (!name) return "?";
    const cleaned = name.trim();
    // If there's a space, take first two letters of each part
    if (cleaned.includes(' ')) {
        const parts = cleaned.split(/\s+/).filter(Boolean);
        if (parts.length === 0) return "?";
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    // For email or single word, take first two characters
    return cleaned.slice(0, 2).toUpperCase();
}
// return name.splice(0,2).toUpperCase()
/**
 * Normalize a user object from the API
 */
export function normalizeUser(raw) {
    if (!raw) return raw;

    const displayName =  raw.email || raw.username || "";

    const avatar = isAvatarUrl(raw.avatar)
        ? raw.avatar
        : getInitials(displayName);

    return {
        ...raw,
        name: raw.username || raw.email || "Unknown",
        avatar: avatar,
        role: raw.role ?? "viewer",
        isActive: raw.is_active ?? raw.isActive ?? true,
    };
}

export function normalizeUserList(list) {
    return (list ?? []).map(normalizeUser);
}