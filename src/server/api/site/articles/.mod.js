import StorageManager from '#lib/modules/StorageManager.js';
import { MarkdownMetadata } from '#lib/util.js';
import { ImportDirectory } from '@zoodogood/import-directory';
import FileSystem from 'fs/promises';
import Path from 'path';


const DIRECTORY = "static/articles";
		
class ArticlesCacheData {
	#cache = new Map();
	constructor(manager){
		this.manager = manager;
		this.update();
	}

	async update(){
		const files = await this.manager.fetchArticles();
		for (const id of files){
			this.#addToCache(id);
		} 
	}

	getBulk(){
		return Object.fromEntries(
			[...this.#cache.entries()]
		);
	}

	async get(id){
		const cache = this.#cache;
		!cache.has(id) && await this.#addToCache(id);

		return cache.get(id);
	}

	parseMetadata(data){
		const {author: _author, timestamp, tags} = MarkdownMetadata.parse(data) ?? {};
		const author = _author ? {id: _author.id, username: _author.username} : null;

		const content = MarkdownMetadata.removeMetadataFieldIn(data);
		
		const wordsCount = content
			.split(" ")
			.filter(word => word.match(/[a-zа-я]/i))
			.length;

		return {author, timestamp, tags, wordsCount};
	}

	async #addToCache(id){
		const data = await this.manager.getArticleContent(id);
		const metadata = this.parseMetadata(data);
		this.#cache.set(id, metadata);
	}
}


class ArticlesManager {
	static directory = DIRECTORY;
	static CacheData = new ArticlesCacheData(this);

	static async fetchArticles(){
		const filesPaths = await new ImportDirectory({regex: /\.md$/}).takeFilesPath({path: DIRECTORY, subfolders: true});

		const articles = filesPaths
			.map(path => Path.relative(DIRECTORY, path).replaceAll("\\", "/"));

		return articles;
	}

	static async getArticleContent(id){
		const path = id.replace(/\.md$/, "");
		const full = Path.resolve(this.directory, `${ path }.md`);
		try {
			const content = String(await FileSystem.readFile(full));
			return content;
		}
		catch (error){
			if (error.code !== "ENOENT"){
				throw error;
			}

			return null;
		}
	}

	static async createArticle({id, author, content}){
		const path = id.replace(/\.md$/, "");
		const full = Path.resolve(this.directory, `${ path }.md`);

		
		await FileSystem.mkdir(Path.resolve(full, "../"), { recursive: true });
		const metadata = MarkdownMetadata.parse(content) ?? {};
		Object.assign(metadata, {author, timestamp: Date.now()});

		content = MarkdownMetadata.replace(content, metadata);
		
		await StorageManager.write(`articles/${ path }.md`, content);
		await FileSystem.writeFile(full, content);
		return metadata;
	}
}


export { ArticlesManager };