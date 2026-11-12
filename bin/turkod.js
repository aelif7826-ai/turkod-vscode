#!/usr/bin/env node
'use strict';

/**
 * `türkod` komutunun giriş noktası.
 *
 * Komut satırı mantığı TypeScript'te (`src/turkodCli.ts`) yazılır ve `out/`
 * klasörüne derlenir. Bu dosya yalnızca derlenmiş sürümü başlatır.
 */
require('../out/turkodCli.js').baslat();
