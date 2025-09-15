// utils/profilePic.js
const PROFILE_KEY_BASE = "souvenir_profile_pic_v1";
const profileKeyFor = (uid) => `${PROFILE_KEY_BASE}:${uid}`;

export function getProfilePic(uid) {
    try {
        if (!uid) return null;
        return localStorage.getItem(profileKeyFor(uid));
    } catch {
        return null;
    }
}

export function setProfilePic(uid, dataUrl) {
    try {
        if (!uid || !dataUrl) return;
        localStorage.setItem(profileKeyFor(uid), dataUrl);
    } catch { }
}

export function clearProfilePic(uid) {
    try {
        if (!uid) return;
        localStorage.removeItem(profileKeyFor(uid));
    } catch { }
}