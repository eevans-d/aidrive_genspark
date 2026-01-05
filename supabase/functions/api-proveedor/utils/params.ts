export function sanitizeSearchInput(input: string): string {
    return input.replace(/[<>"'&]/g, '').substring(0, 100);
}
