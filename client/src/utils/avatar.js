export function getUserAvatar(user, fallback = "?") {
    if (!user) return fallback;

  // If avatar is a valid URL, return it
    if (user.avatar && (user.avatar.startsWith('https://res.cloudinary.com/') || user.avatar.startsWith('https://res.cloudinary.com/'))) {
        return user.avatar;
    }

  // Otherwise, return initials from username or email
    const name = user.email || "";
    
    if (!name) return fallback;

  // Split by spaces or dots, take first two parts, get first letter of each
    const parts = name.slice(0,2).toUpperCase();
    if (parts.length === 0) return fallback;

    let initials = parts[0][0].toUpperCase();
    if (parts.length > 1) {
    initials += parts[1][0].toUpperCase();
}
    return initials.slice(0, 1);
}

/**
 * Check if a string is a URL (starts with http)
 */
export function isAvatarUrl(value) {
    if (!value) return false;
    return value.startsWith('https://res.cloudinary.com/') || value.startsWith('https://res.cloudinary.com/');
}