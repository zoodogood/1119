import yaml from 'yamljs';

class MarkdownMetadata {
	regex = /(?<=^---\n).*?(?=\n^---)/sm;

	replace(content, data){
		if (!content.match(this.regex)){
			content = this.createMetadataFieldIn(content);
		}


		data = yaml.stringify(data);
		return content.replace(this.regex, data);
	}

	parse(content){
		const metadata = content.match(this.regex)?.[0];
		if (!metadata){
			return null;
		}

		return yaml.parse(metadata);
	}

	assign(content, data){
		data = Object.assign(data, this.parse(content));
		return this.replace(content, data);
	}

	createMetadataFieldIn(content){
		const field = "---\n\n\n---\n"
		return `${ field }${ content }`;
	}
}

export { MarkdownMetadata };