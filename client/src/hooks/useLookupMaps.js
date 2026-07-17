// src/hooks/useLookupMaps.js
import { useEffect, useState } from 'react';
import { getRootCategories, listTags } from '../api/categories';

let cachedCategories = null;
let cachedTags = null;

export function useLookupMaps() {
    const [categoryMap, setCategoryMap] = useState({});
    const [tagMap, setTagMap] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    const fetchMaps = async () => {
        try {
        let cats, tags;

        if (cachedCategories) {
            cats = cachedCategories;
        } else {
            const catRes = await getRootCategories();
            cats = catRes.results ?? catRes ?? [];
            cachedCategories = cats;
        }

        if (cachedTags) {
            tags = cachedTags;
        } else {
            const tagRes = await listTags();
            tags = tagRes.results ?? tagRes ?? [];
            cachedTags = tags;
        }

        const catMap = {};
        cats.forEach(c => { catMap[c.id] = c.name; });

        const tagMap = {};
        tags.forEach(t => { tagMap[t.id] = t.name; });

        setCategoryMap(catMap);
        setTagMap(tagMap);
        } catch (err) {
        console.error('Failed to load lookup maps:', err);
        } finally {
        setLoading(false);
        }
    };

    fetchMaps();
    }, []);

    return { categoryMap, tagMap, loading };
}