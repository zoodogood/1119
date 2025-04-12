import { PropertiesEnum , PropertiesList } from '#root/src/data/Properties.js'
import { createCollectionWithAliases } from '#root/src/nodejs/Collection/transformToCollectionUsingKey.js'
import { ending } from '@zoodogood/utils/primitives'
import { Emoji } from 'discord.js'

createCollectionWithAliases( [
	{
		key: 'coins' ,
		aliases: PropertiesList.coins.alias.split( ' ' ) ,
		ending: count =>
			`<:coin:637533074879414272> ${ ending( count , 'Коин' , 'ов' , '' , 'а' ) }` ,

	} ,
	{
		key: 'exp' ,
		aliases: PropertiesList.exp.alias.split( ' ' ) ,
		ending: count =>
			`<:crys2:763767958559391795> ${ ending( count , 'Опыт' , 'а' , '' , 'а' ) }` ,
	} ,
	{
		key: 'chestBonus' ,
		aliases: PropertiesList.chestBonus.alias.split( ' ' ) ,
		ending: count =>
			`<a:chest:805405279326961684> ${ ending(
				count ,
				'Бонус' ,
				'ов' ,
				'' ,
				'а' ,
			) } сундука` ,
	} ,
	{
		key: 'void' ,
		aliases: PropertiesList.void.alias.split( ' ' ) ,
		ending: count =>
			`<a:void:768047066890895360> ${ ending(
				count ,
				'Кам' ,
				'ней' ,
				'ень' ,
				'ня' ,
			) } нестабильности` ,
	} ,
	{
		key: 'berrys' ,
		aliases: PropertiesList.berrys.alias.split( ' ' ) ,
		ending: count =>
			`<:berry:756114492055617558> ${ ending( count , 'Клубник' , '' , 'а' , 'и' ) }` ,
	} ,
	{
		key: 'chilli' ,
		aliases: PropertiesList.chilli.alias.split( ' ' ) ,
		ending: count => `🌶️ ${ ending( count , 'Пер' , 'цев' , 'ец' , 'ца' ) }` ,
	} ,
	{
		key: 'monster' ,
		aliases: PropertiesList.monster.alias.split( ' ' ) ,
		ending: count => `🐲 ${ ending( count , 'Монстр' , 'ов' , '' , 'а' ) }` ,
	} ,
	{
		key: 'thiefGloves' ,
		aliases: PropertiesList.thiefGloves.alias.split( ' ' ) ,
		ending: count => `🧤 ${ ending( count , 'Перчат' , 'ки' , 'у' , 'ки' ) }` ,
		display: count => `🧤 Перчатки ${ count } шт.` ,
	} ,
	{
		key: 'keys' ,
		aliases: PropertiesList.keys.alias.split( ' ' ) ,
		ending: count => `🔩 ${ ending( count , 'Ключ' , 'ей' , '' , 'а' ) }` ,
	} ,
	{
		key: 'seed' ,
		aliases: PropertiesList.seed.alias.split( ' ' ) ,
		ending: count => `🌱 ${ ending( count , 'Сем' , 'ян' , 'ечко' , 'ечка' ) }` ,
	} ,
	{
		key: 'presents' ,
		aliases: PropertiesList.presents.alias.split( ' ' ) ,
		ending: count => `🎁 ${ ending( count , 'Подар' , 'ков' , 'ок' , 'ка' ) }` ,
	} ,
	{
		key: 'cheese' ,
		aliases: PropertiesList.cheese.alias.split( ' ' ) ,
		ending: count => `🧀 ${ ending( count , 'Сыр' , 'ов' , '' , 'а' ) }` ,
	} ,
	{
		key: 'snowyTree' ,
		aliases: [ 'snowy' , 'новогоднее' ] ,
		ending: count => `${ Emoji.snowyTree.toString() } ${ count } SnowyTree` ,
	} ,
	{
		key: 'iq' ,
		aliases: [ 'iq' , 'icq' , 'iqbanana' , 'айкью' ] ,
		ending: count => `<a:iq:768047041053196319> ${ count } IQ` ,
	} ,
	{
		key: 'coinsPerMessage' ,
		aliases: [
			'коинов за сообщение' ,
			'награда коин-сообщений' ,
			'coinspermessages' ,
		] ,
		ending: count =>
			`✨ ${ ending( count , 'Коин' , 'ов' , '' , 'а' ) } за сообщение` ,
	} ,
	{
		key: 'voidCooldown' ,
		aliases: [
			'уменьшений кулдауна' ,
			'уменьшение кулдауна' ,
			'уменьшения кулдауна' ,
			'voidcooldown' ,
		] ,
		limit: 20 ,
		ending: count => `🌀 ${ ending( count , 'Бонус' , 'ов' , '' , 'а' ) }` ,
		display: count => `🌀 Бонус "Уменьшение кулдауна" ${ count }/20` ,
	} ,
	{
		key: 'voidPrice' ,
		aliases: [ 'скидок на котёл' , 'скидок на котел' , 'voidprice' ] ,
		limit: 3 ,
		ending: count => `⚜️ ${ ending( count , 'Бонус' , 'ов' , '' , 'а' ) }` ,
		display: count => `⚜️ Бонус "Скидок на котёл" ${ count }/3` ,
	} ,
	{
		key: 'voidDouble' ,
		aliases: [ 'нестабилити' , 'voiddouble' ] ,
		limit: 1 ,
		ending: count => `🃏 ${ ending( count , 'Бонус' , 'ов' , '' , 'а' ) }` ,
		display: count => `🃏 Бонус "Нестабилити" ${ count }/1` ,
	} ,
	{
		key: 'voidQuests' ,
		aliases: [ 'усиление квестов' , 'усиление квеста' , 'voidquests' ] ,
		limit: 5 ,
		ending: count => `🔱 ${ ending( count , 'Бонус' , 'ов' , '' , 'а' ) }` ,
		display: count => `🔱 Бонус "Усиление квестов" ${ count }/5` ,
	} ,
	{
		key: 'voidCoins' ,
		aliases: [ 'шанс коина' , 'шанс коинов' , 'voidcoins' ] ,
		limit: 7 ,
		ending: count => `♦️ ${ ending( count , 'Бонус' , 'ов' , '' , 'а' ) }` ,
		display: count => `♦️ Бонус "Шанс коина" ${ count }/7` ,
	} ,
	{
		key: 'voidMonster' ,
		aliases: [ 'монстр-защитник' , 'монстр защитник' , 'voidmonster' ] ,
		limit: 1 ,
		ending: count => `💖 ${ ending( count , 'Бонус' , 'ов' , '' , 'а' ) }` ,
		display: count => `💖 Бонус "Монстр-защитник" ${ count }/1` ,
	} ,
	{
		key: 'voidThief' ,
		aliases: [ 'бонусы от перчаток' , 'voidthief' ] ,
		ending: count => `💠 ${ ending( count , 'Бонус' , 'ов' , '' , 'а' ) }` ,
		display: count => `💠 Бонус "Бонусы от перчаток" ${ count }` ,
	} ,
	{
		key: 'voidMysticClover' ,
		aliases: [
			'умение заворож. клевер' ,
			'умение заворожить клевер' ,
			'заворожение клевера' ,
			'заворожить клевер' ,
			'заворожения клевера' ,
			'voidmysticclover' ,
		] ,
		ending: count => `🍵 ${ ending( count , 'Бонус' , 'ов' , '' , 'а' ) }` ,
		display: count => `🍵 Бонус "Умение заворож. Клевер" ${ count }/50` ,
	} ,
	{
		key: 'voidTreeFarm' ,
		aliases: [ 'фермер' , 'фермеров' , 'фермера' , 'voidtreefarm' ] ,
		ending: count => `📕 ${ ending( count , 'Бонус' , 'ов' , '' , 'а' ) }` ,
		display: count => `📕 Бонус "Фермер" ${ count }` ,
	} ,
	{
		key: 'voidCasino' ,
		aliases: [ 'казино' , 'voidcasino' ] ,
		limit: 1 ,
		ending: count => `🥂 ${ ending( count , 'Бонус' , 'ов' , '' , 'а' ) }` ,
		display: count => `🥂 Бонус "Казино" ${ count }/1` ,
	} ,
	{
		key: PropertiesEnum.lollipops ,
		aliases: PropertiesList.lollipops.alias.split( ' ' ) ,
		ending: count => `🍭 ${ ending( count , 'Леден' , 'цов' , 'ец' , 'ца' ) }` ,
	} ,
] )
