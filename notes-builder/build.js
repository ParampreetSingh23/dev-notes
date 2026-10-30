// usage: node build.js <in.md> <out.html>
const fs = require('fs');
const { marked } = require('marked');

const [src, out] = process.argv.slice(2);
const slug = (s) => s.replace(/<[^>]+>/g, '').toLowerCase().replace(/&[a-z#0-9]+;/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

let md = fs.readFileSync(src, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '');
md = md.replace(/\[\[#([^\]]+)\]\]/g, (_, h) => `[${h}](#${slug(h)})`); // Obsidian heading links

let html = marked.parse(md, { gfm: true });

// Obsidian callouts: > [!type]-? Title
html = html.replace(/<blockquote>\s*<p>\[!(\w+)\]([-+]?) ?(.*?)(\n|<\/p>)([\s\S]*?)<\/blockquote>/g,
  (_, type, fold, title, sep, rest) => {
    const body = (sep === '\n' ? '<p>' : '') + rest;
    title = title || type[0].toUpperCase() + type.slice(1);
    return fold
      ? `<details class="callout ${type}"><summary>${title}</summary>${body}</details>`
      : `<div class="callout ${type}"><div class="ctitle">${title}</div>${body}</div>`;
  });

const nav = [];
html = html.replace(/<h([23])>(.*?)<\/h\1>/g, (_, lvl, text) => {
  const id = slug(text);
  if (lvl === '2') nav.push(`<a href="#${id}">${text}</a>`);
  return `<h${lvl} id="${id}">${text}</h${lvl}>`;
});
html = html.replace(/<table>/g, '<div class="tw"><table>').replace(/<\/table>/g, '</table></div>');

const title = (html.match(/<h1>(.*?)<\/h1>/) || [, 'Notes'])[1].replace(/<[^>]+>/g, '');
const tpl = fs.readFileSync(__dirname + '/template.html', 'utf8');
fs.writeFileSync(out, tpl.replaceAll('{{TITLE}}', title).replace('{{NAV}}', nav.join('\n')).replace('{{BODY}}', html));
console.log(`wrote ${out}: ${nav.length} sections`);
