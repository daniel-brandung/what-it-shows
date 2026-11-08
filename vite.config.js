// Build config added for this export, so the kb pages render the way the desk sees them.
// SvelteKit 3 takes its config here; svelte.config.js is no longer read.
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const runbook = fileURLToPath(new URL('./src/lib/layouts/runbook.svelte', import.meta.url));

export default defineConfig({
  plugins: [
    sveltekit({
      extensions: ['.svelte', '.svx'],
      preprocess: [vitePreprocess(), mdsvex({ extensions: ['.svx'], layout: { runbook } })],
      adapter: adapter({ pages: 'rendered', assets: 'rendered', strict: true }),
      prerender: { entries: ['/kb'] },
    }),
  ],
});
