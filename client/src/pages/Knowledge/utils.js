import { ROLES } from "../../utils/constants.js";

export function filterArticlesByRole(articles, user) {
    if (!user) return articles.filter(a => a.status === 'published');
    const role = user.role;
    if (role === ROLES.VIEWER) return articles.filter(a => a.status === 'published');
    if (role === ROLES.EDITOR) {
    return articles.filter(a => 
        a.status === 'published' ||
        (a.status === 'draft' && a.author === user.id)
    );
    }
    if (role === ROLES.ADMIN) {
    return articles.filter(a => 
        a.status === 'published' || a.status === 'pending_review'
    );
    }
    return articles.filter(a => a.status === 'published');
}