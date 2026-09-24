/**
 * Parses a single Set-Cookie header value into its constituent parts.
 *
 * The parser is intentionally permissive: it accepts what real-world servers
 * send, not just what RFC 6265 strictly allows. Unrecognised attributes are
 * ignored rather than causing an error, because a cookie header with one
 * unknown extension attribute is still usable.
 *
 * @param {string} header - The raw Set-Cookie header value.
 * @returns {object}
 */
export function parseSetCookie(header) {
  if (typeof header !== 'string') {
    throw new TypeError('Set-Cookie header must be a string');
  }

  const trimmed = header.trim();
  if (trimmed === '') {
    throw new SyntaxError('Set-Cookie header is empty');
  }

  const parts = splitHeader(trimmed);
  const firstPair = parseNameValue(parts[0]);

  const cookie = {
    name: firstPair.name,
    value: firstPair.value,
    domain: undefined,
    path: undefined,
    expires: undefined,
    maxAge: undefined,
    httpOnly: false,
    secure: false,
    sameSite: undefined,
  };

  for (let i = 1; i < parts.length; i++) {
    const attribute = parseAttribute(parts[i]);
    switch (attribute.name.toLowerCase()) {
      case 'domain':
        cookie.domain = attribute.value;
        break;
      case 'path':
        cookie.path = attribute.value;
        break;
      case 'expires':
        cookie.expires = attribute.value;
        break;
      case 'max-age':
        cookie.maxAge = parseMaxAge(attribute.value);
        break;
      case 'httponly':
        cookie.httpOnly = true;
        break;
      case 'secure':
        cookie.secure = true;
        break;
      case 'samesite':
        cookie.sameSite = attribute.value;
        break;
      default:
        // Unknown attributes are intentionally ignored.
        break;
    }
  }

  return cookie;
}

/**
 * Splits a header on semicolons, respecting quoted values.
 * For example: `foo="a;b"; path=/` becomes [`foo="a;b"`, `path=/`].
 *
 * @param {string} header
 * @returns {string[]}
 */
function splitHeader(header) {
  const parts = [];
  let current = '';
  let inQuotes = false;

  for (const ch of header) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === ';' && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }

  parts.push(current.trim());
  return parts.filter((part) => part !== '');
}

/**
 * Parses the first name=value pair of the header.
 *
 * @param {string} part
 * @returns {{name: string, value: string}}
 */
function parseNameValue(part) {
  const eqIndex = part.indexOf('=');
  if (eqIndex === -1) {
    return { name: part, value: '' };
  }

  const name = part.slice(0, eqIndex).trim();
  const rawValue = part.slice(eqIndex + 1).trim();

  if (rawValue.startsWith('"') && rawValue.endsWith('"') && rawValue.length >= 2) {
    return { name, value: rawValue.slice(1, -1) };
  }

  return { name, value: rawValue };
}

/**
 * Parses an attribute like `Path=/`, `HttpOnly`, or `SameSite=Lax`.
 * Flag attributes have an undefined value.
 *
 * @param {string} part
 * @returns {{name: string, value: string | undefined}}
 */
function parseAttribute(part) {
  const eqIndex = part.indexOf('=');
  if (eqIndex === -1) {
    return { name: part.trim(), value: undefined };
  }

  const name = part.slice(0, eqIndex).trim();
  const rawValue = part.slice(eqIndex + 1).trim();

  if (rawValue.startsWith('"') && rawValue.endsWith('"') && rawValue.length >= 2) {
    return { name, value: rawValue.slice(1, -1) };
  }

  return { name, value: rawValue };
}

/**
 * Parses Max-Age into an integer number of seconds.
 * Non-numeric values are returned as undefined.
 *
 * @param {string} value
 * @returns {number | undefined}
 */
function parseMaxAge(value) {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    return undefined;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}
