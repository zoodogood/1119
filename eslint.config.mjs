import lintjs from "@eslint/js"
import stylistic from "@stylistic/eslint-plugin"
import perfectionist from "eslint-plugin-perfectionist"
import globals from "globals"

export default [
	{
		plugins: {
			perfectionist ,
			"@stylistic": stylistic ,
		} ,
		files: [
			"**/*.js" ,
			"**/*.cjs" ,
			"**/*.mjs" ,
			"**/*.ts" ,
			"**/*.tsx" ,
		] ,
		languageOptions: {
			globals: {
				... globals.browser ,
				... globals.node ,
			} ,
			ecmaVersion: "latest" ,
			sourceType: "module" ,
		} ,

		rules: {
			... stylistic.configs.recommended.rules ,
			... lintjs.configs.recommended.rules ,
			"@stylistic/brace-style": [ "error" , "1tbs" , { allowSingleLine: true } ] ,
			"@stylistic/comma-dangle": [ "error" , "always-multiline" ] ,
			"@stylistic/comma-spacing": [ "error" , { before: true , after: true } ] ,
			"@stylistic/array-bracket-spacing": [ "error" , "always" ] ,
			"@stylistic/key-spacing": [ "error" , { beforeColon: false , afterColon: true } ] ,
			"@stylistic/rest-spread-spacing": [ "error" , "always" ] ,
			"@stylistic/space-in-parens": [ "error" , "always" ] ,
			"@stylistic/indent": [
				"error" ,
				"tab" ,
				{ tabLength: 2 } ,
			] ,
			"@stylistic/no-tabs": [ "off" ] ,
			"@stylistic/quotes": [ "error" , "double" ] ,
			"eqeqeq": [
				"error" ,
				"always" ,
			] ,
			"no-constant-condition": [ "off" ] ,
			"prefer-const": [ "error" ] ,
			"no-fallthrough": [ "off" ] ,
			"no-async-promise-executor": [ "off" ] ,

			"no-unused-vars": [
				"error" ,
				{
					argsIgnorePattern: "^_" ,
				} ,
			] ,

			"perfectionist/sort-classes": [ "error" ] ,
		} ,
	} ,
	{
		files: [ "**/*.svelte" ] ,

		languageOptions: {
			parser: ( await import( "svelte-eslint-parser" ) ).default ,
		} ,
	} ,
]
