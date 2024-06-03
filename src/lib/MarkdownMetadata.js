import yaml from "yaml";

class MarkdownMetadata {
  static FIELD_CONTENT = "---\n\n---\n";
  static regex =
    /(?<open>(?:\s\t)*^---(?:\s\t)*\n)(?<content>.*?)(?<close>(?:\s\t)*^---(?:\s\t)*\n)/ms;

  static yaml = yaml;

  static assign(content, data) {
    data = Object.assign(data, this.parse(content));
    return this.replace(content, data);
  }

  static createMetadataFieldIn(content) {
    const field = this.FIELD_CONTENT;
    return `${field}${content}`;
  }

  static parse(content) {
    const metadata = content.match(this.regex);
    if (!metadata) {
      return null;
    }

    return yaml.parse(metadata.groups.content);
  }

  static removeMetadataFieldIn(content) {
    return content.replace(this.regex, "");
  }

  static replace(content, data) {
    if (!content.match(this.regex)) {
      content = this.createMetadataFieldIn(content);
    }

    data = yaml.stringify(data);
    return content.replace(
      this.regex,
      (_full, open, _content, close) => `${open}${data}${close}`,
    );
  }
}

export { MarkdownMetadata };
