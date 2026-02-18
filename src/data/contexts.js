import { CMD_REG } from './commands';
import { detectStackFromFiles } from './stacks';

// ═══════════════════════════════════════
// PROJECT DETECTION — scans a directory
// for known config files and matches them
// against the CMD_REG keys.
// ═══════════════════════════════════════

/** Files we look for when scanning a directory */
export const DETECTABLE_FILES = Object.keys(CMD_REG);

/**
 * Given a list of file/folder names in a directory,
 * return which known config files are present.
 */
export function detectContextFiles(entryNames) {
    return DETECTABLE_FILES.filter(f => entryNames.includes(f));
}

/**
 * Build a context object from a real directory scan result.
 * @param {string} dirPath - absolute path
 * @param {string[]} entryNames - names of files/dirs in that path
 * @returns {object|null} context or null if nothing detected
 */
export function buildContext(dirPath, entryNames) {
    const detected = detectContextFiles(entryNames);
    if (detected.length === 0) return null;

    // Derive project name from folder basename
    const project = dirPath.split(/[/\\]/).filter(Boolean).pop() || dirPath;

    return {
        project,
        path: dirPath,
        detected,
        stack: detectStackFromFiles(detected),
    };
}
