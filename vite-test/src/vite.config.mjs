import {defineConfig} from 'vite'
import commonjs from 'vite-plugin-commonjs'

export default defineConfig({
    base: '',
    plugins: [
      commonjs(/* options */),
    ],
    build: {
        sourcemap: "inline"
    }
})