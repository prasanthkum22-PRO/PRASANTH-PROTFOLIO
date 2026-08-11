
// Also sync with window.process if needed
if (typeof window !== 'undefined') {
    window.process = window.process || { env: window.ENV };
}
