# http-set-cookie

Parses a `Set-Cookie` HTTP header into name, value, and standard attribute fields.

```js
import { parseSetCookie } from 'http-set-cookie';

const cookie = parseSetCookie(
  'session=abc123; Path=/; HttpOnly; Max-Age=3600; SameSite=Lax'
);

console.log(cookie.name);    // 'session'
console.log(cookie.value);   // 'abc123'
console.log(cookie.path);    // '/'
console.log(cookie.httpOnly); // true
console.log(cookie.maxAge);   // 3600
console.log(cookie.sameSite); // 'Lax'
```

## Why this exists

Servers frequently send `Set-Cookie` headers that are slightly malformed or use
non-standard attributes. A strict RFC 6265 parser rejects those headers, which
breaks real-world integrations. This library takes a permissive approach:
unrecognised attributes are ignored, and well-known attributes are parsed with
lenient case handling. The trade-off is that some invalid headers will parse
successfully instead of failing loudly.

## Edge cases

- Quoted cookie values may contain semicolons. The parser splits on semicolons
  only outside quotes, so `note="a;b"; path=/` is handled correctly.
- `Max-Age` must be an integer. Non-numeric values such as `Max-Age=soon` are
  returned as `undefined`.
- The `Expires` attribute is returned as its raw string. Converting it to a
  `Date` is left to the caller, because some servers send non-standard date
  formats.

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

## Limitations

Values are coerced to floats, so very large integers lose precision. If you need
exact integer aggregates over a window, this is the wrong tool.

