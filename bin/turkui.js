#!/usr/bin/env node
'use strict';

/**
 * `türküi` komutunun giriş noktası.
 *
 * Komut satırı mantığı TypeScript'te (`src/turkuiCli.ts`) yazılır ve `out/`
 * klasörüne derlenir. Bu dosya yalnızca derlenmiş sürümü başlatır.
 */
require('../out/turkuiCli.js').baslat();
