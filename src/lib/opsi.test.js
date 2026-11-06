import { test } from 'node:test';
import assert from 'node:assert/strict';

import { aturPoinOpsi } from './opsi.js';

// Uji aturan poin otomatis: poin opsi jawaban selalu 1, 2, 3, ... sesuai urutan
test('mengisi poin 1, 2, 3, ... sesuai urutan array', () => {
  const hasil = aturPoinOpsi([
    { opsi: 'Belum berkembang', poin: 9 },
    { opsi: 'Sedang berkembang', poin: 4 },
    { opsi: 'Sesuai harapan', poin: 7 },
  ]);
  assert.deepEqual(
    hasil.map((o) => o.poin),
    [1, 2, 3]
  );
});

test('mengembalikan array baru, tidak mengubah array asal', () => {
  const asal = [{ opsi: 'A', poin: 5 }, { opsi: 'B', poin: 6 }];
  const hasil = aturPoinOpsi(asal);
  assert.notEqual(hasil, asal);
  assert.equal(asal[0].poin, 5);
  assert.equal(hasil[0].poin, 1);
});

test('array kosong menghasilkan array kosong', () => {
  assert.deepEqual(aturPoinOpsi([]), []);
});
