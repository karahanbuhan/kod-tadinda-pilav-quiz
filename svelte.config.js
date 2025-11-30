import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Tailwind için gerekli işlemci
	preprocess: vitePreprocess(),

	kit: {
		// Sunucu (VPS/Caddy) için Node adaptörü
		adapter: adapter()
	}
};

export default config;