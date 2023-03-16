import { test } from 'node:test';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { Blob } from 'node:buffer';
import assert from 'node:assert/strict';
import { start, stop } from './server';

test('tests', async (t) => {
  const dogFile = await fsp.readFile(path.join(__dirname, 'dog.png'));
  await start();

  await t.test('upload image', async () => {
    const form = new FormData();
    form.append(
      'file',
      // @ts-ignore
      new Blob([dogFile], { type: 'image/png' }),
      'goodboy.png'
    );
    form.append('type', 'images/dogs');
    // @ts-ignore
    const response = await fetch('http://localhost:3000/api/media', {
      method: 'POST',
      body: form,
    });
    assert(response.ok);
    const createData = await response.json();
    assert.strictEqual(createData.doc?.filename, 'goodboy.png');
  });

  await t.test('upload image again', async () => {
    const form = new FormData();
    form.append(
      'file',
      // @ts-ignore
      new Blob([dogFile], { type: 'image/png' }),
      'goodboy.png'
    );
    form.append('type', 'images/dogs');
    // @ts-ignore
    const response = await fetch('http://localhost:3000/api/media', {
      method: 'POST',
      body: form,
    });
    assert(response.ok);
    const createData = await response.json();
    assert.strictEqual(createData.doc?.filename, 'goodboy-1.png');
  });

  await t.test('delete image', async () => {
    const form = new FormData();
    form.append(
      'file',
      // @ts-ignore
      new Blob([dogFile], { type: 'image/png' }),
      'goodboy.png'
    );
    form.append('type', 'images/dogs');
    let response = await fetch('http://localhost:3000/api/media', {
      method: 'POST',
      body: form,
    });
    const createData = await response.json();
    const id = createData.doc?.id;
    response = await fetch(`http://localhost:3000/api/media/${id}`, {
      method: 'DELETE',
    });
    assert(response.ok);
  });

  await stop();
});
