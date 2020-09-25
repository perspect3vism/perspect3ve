import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import postcss from "rollup-plugin-postcss";
import { string } from 'rollup-plugin-string'

const production = !process.env.ROLLUP_WATCH;

export default [
{
	input: 'ConstructorIcon.svelte',
	output: {
		sourcemap: true,
		format: 'cjs',
		name: 'ConstructorIcon',
		file: 'build/ConstructorIcon.js'
	},
	plugins: [
		svelte({
			// enable run-time checks when not in production
			dev: !production,
			preprocess: sveltePreprocess(),
			customElement: true,
		}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),
		postcss({
			extract: true,
			minimize: true,
			use: [
			  ['sass', {
				includePaths: [
				  './src/ui/theme',
				  './node_modules'
				]
			  }]
			]
		  }),
		//typescript({ sourceMap: !production }),
		
		// If we're building for production (npm run build
		// instead of npm run dev), minify
		//production && terser()
	],
	watch: {
		clearScreen: false
	}
},

{
	input: 'index.js',
	output: {
		sourcemap: true,
		format: 'cjs',
		name: 'NoteIpfs',
		file: 'build/bundle.js'
	},
	plugins: [
		string({
			include: 'build/*.js'
		}),
		svelte({
			// enable run-time checks when not in production
			dev: !production,
			// we'll extract any component CSS out into
			// a separate file - better for performance
			//css: css => {
			//	css.write('bundle.css');
			//},
			preprocess: sveltePreprocess(),
		}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),
		postcss({
			extract: true,
			minimize: true,
			use: [
			  ['sass', {
				includePaths: [
				  './src/ui/theme',
				  './node_modules'
				]
			  }]
			]
		  }),
	],
	watch: {
		clearScreen: false
	}
},
]
