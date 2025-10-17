import antfu from '@antfu/eslint-config'

export default antfu( {
	formatters: true ,
	svelte: true ,

	stylistic: {
		indent: 'tab' ,
		quotes: 'single' ,
		semi: false ,
	} ,
	rules: {
		'no-console': [ 'error' , { allow: [ 'error' , 'info' , 'clear' , 'trace' ] } ] ,
		'antfu/no-top-level-await': [ 'off' ] ,
		'eqeqeq': [
			'error' ,
			'always' ,
		] ,
		'no-constant-condition': [ 'off' ] ,
		'prefer-const': [ 'warn' ] ,
		'no-fallthrough': [ 'off' ] ,
		'no-async-promise-executor': [ 'off' ] ,

		'no-unused-vars': [
			'error' ,
			{
				argsIgnorePattern: '^_' ,
			} ,
		] ,
		'perfectionist/sort-classes': [ 'error' ] ,
		'style/brace-style': [ 'error' , '1tbs' , { allowSingleLine: true } ] ,
		'style/comma-dangle': [ 'error' , 'always-multiline' ] ,
		'style/comma-spacing': [ 'error' , { before: true , after: true } ] ,
		'style/array-bracket-spacing': [ 'error' , 'always' ] ,
		'style/key-spacing': [ 'error' , { beforeColon: false , afterColon: true } ] ,
		'style/rest-spread-spacing': [ 'error' , 'always' ] ,
		'style/space-in-parens': [ 'error' , 'always' ] ,
		'style/indent': [
			'error' ,
			'tab' ,
			{ tabLength: 2 } ,
		] ,
		'style/no-tabs': [ 'off' ] ,
		'style/padding-line-between-statements': [
			'error' ,
			{ blankLine: 'always' , prev: [ 'case' , 'default' ] , next: '*' } ,
		] ,
		'style/one-var-declaration-per-line': [ 'error' , 'initializations' ] ,
		'style/new-parens': [ 'error' , 'never' ] ,
		'style/template-curly-spacing': [ 'error' , 'always' ] ,
		'style/type-annotation-spacing': [ 'error' , { before: true , after: true } ] ,
		'style/computed-property-spacing': [ 'error' , 'always' ] ,
		'array-callback-return': [ 'error' , { checkForEach: true } ] ,
		'regexp/no-obscure-range': [ 'off' ] ,
	} ,
} )
