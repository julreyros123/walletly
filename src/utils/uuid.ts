const byteToHex: string[] = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).slice(1));
}

function hashBytes(input: string): Uint8Array {
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  let h3 = 0x811c9dc5;
  let h4 = 0x811c9dc5;

  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c + i;
    h2 = Math.imul(h2, 0x01000193);
    h3 ^= c + i * 17;
    h3 = Math.imul(h3, 0x01000193);
    h4 ^= c + i * 31;
    h4 = Math.imul(h4, 0x01000193);
  }

  const bytes = new Uint8Array(16);
  const values = [h1, h2, h3, h4];
  values.forEach((value, idx) => {
    bytes[idx * 4] = (value >>> 24) & 0xff;
    bytes[idx * 4 + 1] = (value >>> 16) & 0xff;
    bytes[idx * 4 + 2] = (value >>> 8) & 0xff;
    bytes[idx * 4 + 3] = value & 0xff;
  });

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return bytes;
}

export function uuidFromString(input: string): string {
  const bytes = hashBytes(input);
  return (
    byteToHex[bytes[0]] +
    byteToHex[bytes[1]] +
    byteToHex[bytes[2]] +
    byteToHex[bytes[3]] +
    '-' +
    byteToHex[bytes[4]] +
    byteToHex[bytes[5]] +
    '-' +
    byteToHex[bytes[6]] +
    byteToHex[bytes[7]] +
    '-' +
    byteToHex[bytes[8]] +
    byteToHex[bytes[9]] +
    '-' +
    byteToHex[bytes[10]] +
    byteToHex[bytes[11]] +
    byteToHex[bytes[12]] +
    byteToHex[bytes[13]] +
    byteToHex[bytes[14]] +
    byteToHex[bytes[15]]
  );
}
