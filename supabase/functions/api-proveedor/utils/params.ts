export function sanitizeSearchInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input
        .replace(/[<>"'&;`]/g, '')
        .replace(/[\x00-\x1F\x7F]/g, '')
        .trim()
        .substring(0, 100);
}
