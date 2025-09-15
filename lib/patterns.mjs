/**
 * Pattern matching utilities for collector detection
 * Handles URL normalization and glob pattern matching
 */

/**
 * Normalize a URL string, rejecting invalid protocols and non-HTTP(S) URLs
 * @param {string} input - Raw URL string from HTML attributes
 * @param {string} baseUrl - Base URL for relative URLs
 * @returns {URL|null} - Normalized URL object or null if invalid
 */
export function normalizeUrl(input, baseUrl = '') {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Reject invalid protocols
  if (trimmed.startsWith('javascript:') ||
      trimmed.startsWith('mailto:') ||
      trimmed.startsWith('tel:') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('?')) {
    return null;
  }

  try {
    // Handle relative URLs
    if (trimmed.startsWith('//')) {
      return new URL('https:' + trimmed);
    }

    if (trimmed.startsWith('/')) {
      if (!baseUrl) return null;
      const base = new URL(baseUrl);
      return new URL(trimmed, base.origin);
    }

    // Handle absolute URLs
    const url = new URL(trimmed);

    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }

    return url;
  } catch (err) {
    // Invalid URL format
    return null;
  }
}

/**
 * Match a URL against a glob pattern
 * Supports basic glob syntax: * for wildcards in path
 * @param {URL} url - Normalized URL object
 * @param {string} pattern - Glob pattern like "example.com/path/*"
 * @returns {boolean} - True if URL matches the pattern
 */
export function globMatch(url, pattern) {
  if (!url || !pattern) return false;

  // Parse pattern: host/path*
  const patternParts = pattern.split('/');
  if (patternParts.length < 1) return false;

  const patternHost = patternParts[0];
  const patternPath = patternParts.slice(1).join('/');

  // Exact host match (no subdomain matching for now)
  if (url.hostname !== patternHost) {
    return false;
  }

  // Path matching with wildcard support
  if (!patternPath || patternPath === '*') {
    // Match any path if pattern is just host or host/*
    return true;
  }

  const urlPath = url.pathname.replace(/^\//, ''); // Remove leading slash
  const patternPathNormalized = patternPath.replace(/^\//, ''); // Remove leading slash

  if (patternPathNormalized.endsWith('*')) {
    // Prefix match: pattern "path/*" matches "path/anything"
    const prefix = patternPathNormalized.slice(0, -1);
    return urlPath.startsWith(prefix);
  } else {
    // Exact match
    return urlPath === patternPathNormalized;
  }
}

/**
 * Parse comma-separated collector patterns
 * @param {string} collectorsArg - CLI argument like "pattern1/*,pattern2/*"
 * @returns {string[]} - Array of pattern strings
 */
export function parseCollectorPatterns(collectorsArg) {
  if (!collectorsArg || typeof collectorsArg !== 'string') {
    return [];
  }

  return collectorsArg
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Extract text context around an element (for debugging)
 * @param {string} html - Full HTML content
 * @param {string} elementHtml - HTML of the target element
 * @param {number} maxLength - Maximum context length
 * @returns {string} - Context text (truncated)
 */
export function extractContext(html, elementHtml, maxLength = 80) {
  if (!html || !elementHtml) return '';

  const index = html.indexOf(elementHtml);
  if (index === -1) return '';

  const start = Math.max(0, index - 20);
  const end = Math.min(html.length, index + elementHtml.length + 20);
  const context = html.slice(start, end);

  // Clean up HTML tags for readability
  const cleanContext = context.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  return cleanContext.length > maxLength
    ? cleanContext.slice(0, maxLength) + '...'
    : cleanContext;
}
