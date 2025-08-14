<script setup>
import {ref, computed, watch, onMounted, onBeforeUnmount, nextTick} from 'vue';
import {EditorContent, useEditor} from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';

import * as ImageMod from '@tiptap/extension-image';
import * as TableMod from '@tiptap/extension-table';
import * as TableRowMod from '@tiptap/extension-table-row';
import * as TableHeaderMod from '@tiptap/extension-table-header';
import * as TableCellMod from '@tiptap/extension-table-cell';

const Image = ImageMod.default ?? ImageMod.Image;
const Table = TableMod.default ?? TableMod.Table;
const TableRow = TableRowMod.default ?? TableRowMod.TableRow;
const TableHeader = TableHeaderMod.default ?? TableHeaderMod.TableHeader;
const TableCell = TableCellMod.default ?? TableCellMod.TableCell;

import 'katex/dist/katex.min.css';
import renderMathInElement from 'katex/contrib/auto-render';

import * as mammoth from 'mammoth';
import {useUrl} from '@/composables/useUrl';

import htmlDocxUrl from 'html-docx-js/dist/html-docx.js?url';
import html2pdfUrl from 'html2pdf.js/dist/html2pdf.bundle.min.js?url';
import html2canvasUrl from 'html2canvas/dist/html2canvas.min.js?url';
import jsPDFUrl from 'jspdf/dist/jspdf.umd.min.js?url';

const props = defineProps({
	canEdit: {type: Boolean, required: true},
	submission: {type: Object, required: true},
	publication: {type: Object, required: true},
});

const messages = ref([]);
const error = ref('');
const usedMammoth = ref(false);
const mammothError = ref(false);
const debugMammothHtml = ref('');
const debugServerHtml = ref('');

const previewMode = ref(true);

const serverSnapshot = ref(null);
const mammothSnapshot = ref(null);

const isExportingDocx = ref(false);
const isExportingPdf = ref(false);

const publicationPath = computed(
	() =>
		`submissions/${props.submission.id}/publications/${props.publication.id}/bodyText`,
);
function getPublicationApiUrl() {
	const {apiUrl} = useUrl(publicationPath.value);
	return apiUrl.value;
}

const createdBlobUrls = new Set();
function createBlobUrlFromBase64(b64, contentType) {
	const bin = atob(b64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	const blob = new Blob([bytes], {type: contentType});
	const url = URL.createObjectURL(blob);
	createdBlobUrls.add(url);
	return url;
}
function revokeAllBlobUrls() {
	for (const url of createdBlobUrls) {
		try {
			URL.revokeObjectURL(url);
		} catch (e) {
			void e;
		}
	}
	createdBlobUrls.clear();
}

function extractBodyHtml(fullHtml) {
	if (!fullHtml) return '';
	try {
		if (!/<\/?(html|head|body)\b/i.test(fullHtml)) return fullHtml;
		const parser = new DOMParser();
		const doc = parser.parseFromString(fullHtml, 'text/html');
		return doc?.body?.innerHTML || fullHtml;
	} catch {
		return fullHtml;
	}
}
function rewriteDataImagesToBlobUrls(html) {
	if (!html) return html;
	const doc = new DOMParser().parseFromString(html, 'text/html');
	doc.querySelectorAll('img[src^="data:"]').forEach((img) => {
		const src = img.getAttribute('src') || '';
		const m = /^data:([^;]+);base64,(.*)$/i.exec(src);
		if (!m) return;
		const [, contentType, b64] = m;
		const blobUrl = createBlobUrlFromBase64(b64, contentType);
		img.setAttribute('src', blobUrl);
	});
	return doc.body.innerHTML;
}

async function inlineBlobImages(html) {
	if (!html) return html;
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');
	const imgs = Array.from(doc.querySelectorAll('img[src^="blob:"]'));
	await Promise.all(
		imgs.map(async (img) => {
			try {
				const res = await fetch(img.src);
				const blob = await res.blob();
				const b64 = await new Promise((resolve) => {
					const r = new FileReader();
					r.onload = () => resolve(String(r.result));
					r.readAsDataURL(blob);
				});
				img.setAttribute('src', b64);
			} catch (e) {
				void e;
			}
		}),
	);
	return doc.body.innerHTML;
}

async function mammothFromUrl(docxUrl) {
	const res = await fetch(docxUrl, {
		credentials: 'same-origin',
		headers: {
			'X-Csrf-Token': pkp?.currentUser?.csrfToken || '',
			Accept:
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		},
	});
	if (!res.ok)
		throw new Error(`DOCX fetch failed: ${res.status} ${res.statusText}`);

	const arrayBuffer = await res.arrayBuffer();
	const {value, messages: mm} = await mammoth.convertToHtml(
		{arrayBuffer},
		{
			styleMap: ['u => u'],
			convertImage: mammoth.images.imgElement(async (image) => {
				const b64 = await image.readAsBase64String();
				const url = createBlobUrlFromBase64(b64, image.contentType);
				return {src: url, alt: image.altText || ''};
			}),
		},
	);
	messages.value = mm ?? [];
	debugMammothHtml.value = value;
	return value;
}

const extensions = [
	StarterKit,
	Image,
	Table?.configure ? Table.configure({resizable: true}) : Table,
	TableRow,
	TableHeader,
	TableCell,
];

const editorServer = useEditor({
	extensions,
	editable: false,
	content: '<p>Loading…</p>',
});
const editorMammoth = useEditor({
	extensions,
	editable: false,
	content: '<p>Loading…</p>',
});

onBeforeUnmount(() => {
	editorServer.value?.destroy();
	editorMammoth.value?.destroy();
	revokeAllBlobUrls();
});

function typesetRoot(root) {
	if (!root) return;
	renderMathInElement(root, {
		delimiters: [
			{left: '\\(', right: '\\)', display: false},
			{left: '\\[', right: '\\]', display: true},
			{left: '$$', right: '$$', display: true},
		],
		throwOnError: false,
		strict: 'ignore',
	});
}
function typesetEditor(editor) {
	if (!editor?.view?.dom) return;
	nextTick(() => {
		typesetRoot(editor.view.dom);
	});
}

function setEditorHtml(editor, html) {
	if (!editor) return;
	editor.commands.setContent(html || '<p></p>', false);
}

function enablePreview(ed, snapshotRef) {
	if (!ed) return;
	snapshotRef.value = ed.getJSON();
	ed.setEditable(false);
	typesetEditor(ed);
}
function disablePreview(ed, snapshotRef) {
	if (!ed) return;
	if (snapshotRef.value) ed.commands.setContent(snapshotRef.value, false);
	ed.setEditable(props.canEdit);
}
function applyPreviewToBoth() {
	if (previewMode.value) {
		enablePreview(editorServer.value, serverSnapshot);
		enablePreview(editorMammoth.value, mammothSnapshot);
	} else {
		disablePreview(editorServer.value, serverSnapshot);
		disablePreview(editorMammoth.value, mammothSnapshot);
	}
}

async function waitForEditorsReady(timeoutMs = 4000) {
	const deadline = performance.now() + timeoutMs;
	while (!(editorServer.value && editorMammoth.value)) {
		if (performance.now() > deadline) break;
		await new Promise((r) => requestAnimationFrame(r));
	}
	return Boolean(editorServer.value && editorMammoth.value);
}

async function loadBoth() {
	error.value = '';
	usedMammoth.value = false;
	mammothError.value = false;
	messages.value = [];
	debugMammothHtml.value = '';
	debugServerHtml.value = '';

	revokeAllBlobUrls();

	const ready = await waitForEditorsReady();
	if (!ready) {
		error.value = 'Editor not ready.';
		return;
	}

	try {
		const r = await $.ajax({
			url: getPublicationApiUrl(),
			type: 'GET',
			headers: {'X-Csrf-Token': pkp?.currentUser?.csrfToken || ''},
		});

		let serverHtml = extractBodyHtml(r?.bodyTextContent || '');
		debugServerHtml.value = serverHtml;
		serverHtml = rewriteDataImagesToBlobUrls(serverHtml);
		setEditorHtml(editorServer.value, serverHtml);

		const docxUrl = r?.sourceFile?.url || null;
		if (docxUrl) {
			try {
				const mammothHtml = await mammothFromUrl(docxUrl);
				setEditorHtml(editorMammoth.value, mammothHtml);
				usedMammoth.value = true;
			} catch {
				setEditorHtml(editorMammoth.value, serverHtml);
				mammothError.value = true;
			}
		} else {
			setEditorHtml(editorMammoth.value, serverHtml);
		}

		applyPreviewToBoth();
	} catch (e) {
		error.value = String(e?.message || e);
		setEditorHtml(editorServer.value, '<p>Failed to load.</p>');
		setEditorHtml(editorMammoth.value, '<p>Failed to load.</p>');
		applyPreviewToBoth();
	}
}

onMounted(loadBoth);
watch(
	() => [props.publication.id, props.submission.id],
	() => {
		loadBoth();
	},
);
watch(previewMode, () => {
	applyPreviewToBoth();
});

function loadScriptOnce(src, globalCheck) {
	return new Promise((resolve, reject) => {
		try {
			if (globalCheck && globalCheck()) return resolve(true);
			const existing = document.querySelector(`script[data-external="${src}"]`);
			if (existing) {
				existing.addEventListener('load', () => resolve(true), {once: true});
				existing.addEventListener(
					'error',
					() => reject(new Error(`Failed to load ${src}`)),
					{once: true},
				);
				return;
			}
			const s = document.createElement('script');
			s.src = src;
			s.async = true;
			s.setAttribute('data-external', src);
			s.onload = () => resolve(true);
			s.onerror = () => reject(new Error(`Failed to load ${src}`));
			document.head.appendChild(s);
		} catch (e) {
			reject(e);
		}
	});
}
async function ensureDocx() {
	await loadScriptOnce(
		htmlDocxUrl,
		() => !!(window.htmlDocx && typeof window.htmlDocx.asBlob === 'function'),
	);
}
async function ensurePdfBundle() {
	await loadScriptOnce(
		html2pdfUrl,
		() =>
			typeof window.html2pdf === 'function' ||
			(window.html2pdf && typeof window.html2pdf.default === 'function'),
	);
	const maybe = window.html2pdf || (window.html2pdf && window.html2pdf.default);
	if (typeof maybe === 'function') window.__html2pdf__ = maybe;
	else throw new Error('html2pdf loaded but not callable');
}
async function ensurePdfFallbackDeps() {
	await loadScriptOnce(html2canvasUrl, () => !!window.html2canvas);
	await loadScriptOnce(jsPDFUrl, () => !!(window.jspdf && window.jspdf.jsPDF));
}

async function getHtmlForExport() {
	const ed = editorMammoth.value;
	if (!ed) return '';

	const isEmpty = (html) =>
		!html || /^\s*(<p(?: [^>]*)?>\s*<\/p>)?\s*$/.test(html);

	if (previewMode.value && ed.view?.dom) {
		let html = ed.view.dom.innerHTML;
		if (isEmpty(html)) html = ed.getHTML();
		return await inlineBlobImages(html);
	}

	let source = ed.getHTML();
	if (isEmpty(source))
		source = debugMammothHtml.value || debugServerHtml.value || '<p></p>';

	const container = document.createElement('div');
	container.style.position = 'fixed';
	container.style.left = '-99999px';
	container.innerHTML = source;
	document.body.appendChild(container);

	renderMathInElement(container, {
		delimiters: [
			{left: '\\(', right: '\\)', display: false},
			{left: '\\[', right: '\\]', display: true},
			{left: '$$', right: '$$', display: true},
		],
		throwOnError: false,
		strict: 'ignore',
	});

	const html = container.innerHTML;
	container.remove();
	return await inlineBlobImages(html);
}

function sanitizeForDocx(html) {
	const doc = new DOMParser().parseFromString(
		`<div>${html}</div>`,
		'text/html',
	);
	const root = doc.body.firstElementChild;
	root
		.querySelectorAll('script,style,link,meta,iframe,svg')
		.forEach((n) => n.remove());
	root.querySelectorAll('[style]').forEach((el) => {
		const s = (el.getAttribute('style') || '').toLowerCase();
		if (s.includes('display:none') || s.includes('visibility:hidden'))
			el.removeAttribute('style');
	});
	return root.innerHTML;
}

async function exportDocx() {
	try {
		isExportingDocx.value = true;
		await ensureDocx();
		const innerRaw = await getHtmlForExport();
		if (!innerRaw || /^\s*$/.test(innerRaw)) {
			alert('No content to export');
			return;
		}

		const inner = sanitizeForDocx(innerRaw);
		const blob = window.htmlDocx.asBlob(`<div>${inner}</div>`, {
			orientation: 'portrait',
		});
		const name = `submission-${props.submission.id}-publication-${props.publication.id}.docx`;
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = name;
		document.body.appendChild(a);
		a.click();
		setTimeout(() => {
			URL.revokeObjectURL(url);
			a.remove();
		}, 1500);
	} catch (e) {
		alert('DOCX export failed: ' + (e?.message || String(e)));
	} finally {
		isExportingDocx.value = false;
	}
}

async function exportPdf() {
	try {
		isExportingPdf.value = true;
		const inner = await getHtmlForExport();
		if (!inner || /^\s*$/.test(inner)) throw new Error('No content to export');

		const host = document.createElement('div');
		host.style.position = 'fixed';
		host.style.left = '-99999px';
		host.style.top = '0';
		host.style.width = '794px';
		host.innerHTML = `
      <style>
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.5; }
        img { max-width: 100%; height: auto; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ccc; padding: 6px; vertical-align: top; }
        th { background: #f6f6f6; }
        ul, ol { padding-left: 1.5em; }
        .katex-display { overflow-x: auto; }
      </style>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
      <div class="export-body">${inner}</div>
    `;
		document.body.appendChild(host);

		const filename = `submission-${props.submission.id}-publication-${props.publication.id}.pdf`;

		try {
			await ensurePdfBundle();
			await window
				.__html2pdf__()
				.from(host)
				.set({
					filename,
					margin: 10,
					image: {type: 'jpeg', quality: 0.95},
					html2canvas: {scale: 2, useCORS: true},
					jsPDF: {unit: 'pt', format: 'a4', orientation: 'portrait'},
				})
				.save();
		} catch (primaryErr) {
			await ensurePdfFallbackDeps();
			const canvas = await window.html2canvas(host, {scale: 2, useCORS: true});
			const imgData = canvas.toDataURL('image/jpeg', 0.95);

			const pdf = new window.jspdf.jsPDF({
				unit: 'pt',
				format: 'a4',
				orientation: 'portrait',
			});
			const pageWidth = pdf.internal.pageSize.getWidth();
			const pageHeight = pdf.internal.pageSize.getHeight();

			const margin = 10;
			const imgWidth = pageWidth - margin * 2;
			const ratio = imgWidth / canvas.width;
			const imgHeight = canvas.height * ratio;

			pdf.addImage(
				imgData,
				'JPEG',
				margin,
				margin,
				imgWidth,
				Math.min(imgHeight, pageHeight - margin * 2),
			);
			pdf.save(filename);
		} finally {
			host.remove();
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		alert('PDF export failed: ' + msg);
	} finally {
		isExportingPdf.value = false;
	}
}
</script>

<template>
	<div class="wpe">
		<header class="wpe__header">
			<h2 class="wpe__title">Body Text (Compare)</h2>
			<div class="wpe__badges">
				<span class="badge badge--server">Server HTML</span>
				<span
					class="badge"
					:class="usedMammoth ? 'badge--mammoth' : 'badge--fallback'"
				>
					{{ usedMammoth ? 'Mammoth' : 'Mammoth (fallback to server)' }}
				</span>
				<label class="toggle">
					<input v-model="previewMode" type="checkbox" />
					<span>
						{{ previewMode ? 'Preview (rendered)' : 'Edit (raw LaTeX)' }}
					</span>
				</label>
				<div class="actions">
					<button
						class="btn"
						:disabled="isExportingDocx || isExportingPdf"
						@click="exportDocx"
					>
						{{ isExportingDocx ? 'Exporting DOCX…' : 'Export DOCX' }}
					</button>
					<button
						class="btn"
						:disabled="isExportingDocx || isExportingPdf"
						@click="exportPdf"
					>
						{{ isExportingPdf ? 'Exporting PDF…' : 'Export PDF' }}
					</button>
				</div>
			</div>
		</header>

		<p v-if="error" class="wpe__error">Error: {{ error }}</p>

		<div class="compareFlex">
			<section class="col">
				<header class="col__header"><h3>Server HTML</h3></header>
				<div class="viewerShell">
					<EditorContent :editor="editorServer" class="tiptap" />
				</div>
				<details class="dbg">
					<summary>Raw server HTML</summary>
					<pre>{{ debugServerHtml }}</pre>
				</details>
			</section>

			<section class="col">
				<header class="col__header"><h3>Mammoth (DOCX)</h3></header>
				<div class="viewerShell">
					<EditorContent :editor="editorMammoth" class="tiptap" />
				</div>

				<details v-if="messages.length" class="messages">
					<summary>Mammoth messages</summary>
					<ul>
						<li v-for="(m, i) in messages" :key="i">{{ m.message || m }}</li>
					</ul>
				</details>

				<details class="dbg">
					<summary>Raw Mammoth HTML</summary>
					<pre>{{ debugMammothHtml }}</pre>
				</details>

				<p v-if="mammothError" class="note">
					Mammoth conversion failed; showing server HTML in the right pane.
				</p>
			</section>
		</div>
	</div>
</template>

<style>
.wpe {
	max-width: 1200px;
	margin: 20px auto;
	font-family: system-ui, Arial, sans-serif;
}
.wpe__header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	margin-bottom: 12px;
}
.wpe__title {
	margin: 0;
	font-size: 18px;
}
.wpe__badges {
	display: flex;
	gap: 8px;
	align-items: center;
	flex-wrap: wrap;
}
.badge {
	font-size: 0.8rem;
	padding: 2px 8px;
	border-radius: 999px;
	border: 1px solid transparent;
}
.badge--server {
	background: #eef2ff;
	color: #1a237e;
	border-color: #cbd2ff;
}
.badge--mammoth {
	background: #eef7ee;
	color: #1b5e20;
	border-color: #cbe8cb;
}
.badge--fallback {
	background: #fff4e6;
	color: #7c3e00;
	border-color: #ffd8b5;
}

.toggle {
	display: inline-flex;
	gap: 8px;
	align-items: center;
	cursor: pointer;
	user-select: none;
}
.toggle input {
	margin: 0;
}

.actions {
	display: inline-flex;
	gap: 8px;
	margin-left: 8px;
}
.btn {
	appearance: none;
	border: 1px solid #d0d0d0;
	padding: 6px 10px;
	border-radius: 8px;
	background: #fff;
	cursor: pointer;
	font-size: 0.9rem;
}
.btn:disabled {
	opacity: 0.6;
	cursor: default;
}
.btn:hover:not(:disabled) {
	background: #f5f5f5;
}

.wpe__error {
	color: #b00020;
	margin: 0 0 10px;
}

.compareFlex {
	display: flex;
	gap: 16px;
}
.col {
	flex: 0 0 50%;
	max-width: 50%;
	min-width: 0;
	background: #f9f9f9;
	border-radius: 6px;
	padding: 12px;
	display: flex;
	flex-direction: column;
}
.col__header {
	margin-bottom: 8px;
}
.viewerShell {
	background: #fff;
	border: 1px solid #ddd;
	border-radius: 8px;
}

.tiptap {
	min-height: 320px;
	padding: 12px;
}
.tiptap ul,
.tiptap ol {
	list-style: revert;
	padding: revert;
	margin: revert;
}
.tiptap li {
	display: list-item;
}
.tiptap .ProseMirror {
	line-height: 1.5;
}
.tiptap img {
	max-width: 100%;
	height: auto;
	display: block;
}
.tiptap table {
	border-collapse: collapse;
	width: 100%;
}
.tiptap th,
.tiptap td {
	border: 1px solid #ccc;
	padding: 6px;
	vertical-align: top;
}
.tiptap th {
	background: #f6f6f6;
}

.tiptap .katex {
	white-space: normal;
}
.tiptap .katex-display {
	overflow-x: auto;
}

.messages {
	margin-top: 10px;
}
.note {
	margin-top: 8px;
	color: #555;
}
.dbg {
	margin-top: 10px;
}
.dbg pre {
	white-space: pre-wrap;
	font:
		12px/1.4 ui-monospace,
		SFMono-Regular,
		Menlo,
		Monaco,
		Consolas,
		'Courier New',
		monospace;
}

@media (max-width: 1000px) {
	.compareFlex {
		flex-direction: column;
	}
	.col {
		flex: 0 0 auto;
		max-width: 100%;
	}
}
</style>

<!-- <script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

// Robust imports that work with TipTap v2 builds (default) and tolerate named exports
import * as ImageMod from '@tiptap/extension-image'
import * as TableMod from '@tiptap/extension-table'
import * as TableRowMod from '@tiptap/extension-table-row'
import * as TableHeaderMod from '@tiptap/extension-table-header'
import * as TableCellMod from '@tiptap/extension-table-cell'

const Image = ImageMod.default ?? ImageMod.Image
const Table = TableMod.default ?? TableMod.Table
const TableRow = TableRowMod.default ?? TableRowMod.TableRow
const TableHeader = TableHeaderMod.default ?? TableHeaderMod.TableHeader
const TableCell = TableCellMod.default ?? TableCellMod.TableCell

// Sanitization toggle (OFF for debugging)
const SANITIZE = false
function maybeSanitize(html) {
  if (!SANITIZE) return html
  // If you re-enable, add DOMPurify and configure allowed tags/URLs.
  return html
}

import * as mammoth from 'mammoth'
import { useUrl } from '@/composables/useUrl'

const props = defineProps({
  canEdit: { type: Boolean, required: true }, // display-only here
  submission: { type: Object, required: true },
  publication: { type: Object, required: true },
})

const messages = ref([])
const error = ref('')
const usedMammoth = ref(false)
const mammothError = ref(false)
const debugMammothHtml = ref('')
const debugServerHtml = ref('')

/* ---------------------- URLs ---------------------- */
const publicationPath = computed(
  () => `submissions/${props.submission.id}/publications/${props.publication.id}/bodyText`
)
function getPublicationApiUrl() {
  const { apiUrl } = useUrl(publicationPath.value)
  return apiUrl.value
}

/* ---------------------- Blob URL helpers ---------------------- */
const createdBlobUrls = new Set()
function createBlobUrlFromBase64(b64, contentType) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const blob = new Blob([bytes], { type: contentType })
  const url = URL.createObjectURL(blob)
  createdBlobUrls.add(url)
  return url
}
function revokeAllBlobUrls() {
  for (const url of createdBlobUrls) {
	try { URL.revokeObjectURL(url) } catch {}
  }
  createdBlobUrls.clear()
}

/* ---------------------- HTML helpers ---------------------- */
function extractBodyHtml(fullHtml) {
  if (!fullHtml) return ''
  try {
	if (!/<\/?(html|head|body)\b/i.test(fullHtml)) return fullHtml
	const parser = new DOMParser()
	const doc = parser.parseFromString(fullHtml, 'text/html')
	return doc?.body?.innerHTML || fullHtml
  } catch {
	return fullHtml
  }
}
/** Convert any data: images to blob: images (CSP-friendly) */
function rewriteDataImagesToBlobUrls(html) {
  if (!html) return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('img[src^="data:"]').forEach((img) => {
	const src = img.getAttribute('src') || ''
	const m = /^data:([^;]+);base64,(.*)$/i.exec(src)
	if (!m) return
	const [, contentType, b64] = m
	const blobUrl = createBlobUrlFromBase64(b64, contentType)
	img.setAttribute('src', blobUrl)
  })
  return doc.body.innerHTML
}

/* ---------------------- Mammoth conversion (with style map) ---------------------- */
async function mammothFromUrl(docxUrl) {
  const res = await fetch(docxUrl, {
	credentials: 'same-origin',
	headers: {
	  'X-Csrf-Token': pkp?.currentUser?.csrfToken || '',
	  'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	},
  })
  if (!res.ok) throw new Error(`DOCX fetch failed: ${res.status} ${res.statusText}`)

  const arrayBuffer = await res.arrayBuffer()

  const { value, messages: mm } = await mammoth.convertToHtml(
	{ arrayBuffer },
	{
	  // 👉 Keep underline as <u>…</u>
	  styleMap: ['u => u'],
	  // Convert images to blob: URLs (not data:) for CSPs
	  convertImage: mammoth.images.imgElement(async (image) => {
		const b64 = await image.readAsBase64String()
		const url = createBlobUrlFromBase64(b64, image.contentType)
		return { src: url, alt: image.altText || '' }
	  }),
	}
  )
  messages.value = mm ?? []
  debugMammothHtml.value = value // raw, before any optional sanitization
  return maybeSanitize(value)
}

/* ---------------------- TipTap editors (v2) ---------------------- */
const extensions = [
  StarterKit,
  Image,
  Table?.configure ? Table.configure({ resizable: true }) : Table,
  TableRow,
  TableHeader,
  TableCell,
]

const editorServer = useEditor({
  extensions,
  editable: false,
  content: '<p>Loading…</p>',
})
const editorMammoth = useEditor({
  extensions,
  editable: false,
  content: '<p>Loading…</p>',
})

onBeforeUnmount(() => {
  editorServer.value?.destroy()
  editorMammoth.value?.destroy()
  revokeAllBlobUrls()
})

/* ---------------------- Load both panes ---------------------- */
async function waitForEditorsReady(timeoutMs = 4000) {
  const deadline = performance.now() + timeoutMs
  while (!(editorServer.value && editorMammoth.value)) {
	if (performance.now() > deadline) break
	await new Promise(r => requestAnimationFrame(r))
  }
  return Boolean(editorServer.value && editorMammoth.value)
}

async function loadBoth() {
  error.value = ''
  usedMammoth.value = false
  mammothError.value = false
  messages.value = []
  debugMammothHtml.value = ''
  debugServerHtml.value = ''

  revokeAllBlobUrls()

  const ready = await waitForEditorsReady()
  if (!ready) {
	error.value = 'Editor not ready.'
	return
  }

  try {
	const r = await $.ajax({
	  url: getPublicationApiUrl(),
	  type: 'GET',
	  headers: { 'X-Csrf-Token': pkp?.currentUser?.csrfToken || '' },
	})

	// LEFT: server HTML (rewrite any data: images -> blob:)
	let serverHtml = extractBodyHtml(r?.bodyTextContent || '')
	debugServerHtml.value = serverHtml // raw before optional sanitization
	serverHtml = rewriteDataImagesToBlobUrls(serverHtml)
	serverHtml = maybeSanitize(serverHtml)
	editorServer.value?.commands.setContent(serverHtml || '<p></p>', false)

	// RIGHT: Mammoth (or fallback to server HTML)
	const docxUrl = r?.sourceFile?.url || null
	if (docxUrl) {
	  try {
		const mammothHtml = await mammothFromUrl(docxUrl)
		editorMammoth.value?.commands.setContent(mammothHtml || '<p></p>', false)
		usedMammoth.value = true
	  } catch (mErr) {
		console.warn('Mammoth failed; fallback to server HTML:', mErr)
		editorMammoth.value?.commands.setContent(serverHtml || '<p></p>', false)
		mammothError.value = true
	  }
	} else {
	  editorMammoth.value?.commands.setContent(serverHtml || '<p></p>', false)
	}
  } catch (e) {
	error.value = String(e?.message || e)
	editorServer.value?.commands.setContent('<p>Failed to load.</p>', false)
	editorMammoth.value?.commands.setContent('<p>Failed to load.</p>', false)
  }
}

onMounted(loadBoth)
watch(
  () => [props.publication.id, props.submission.id],
  () => { loadBoth() }
)
</script>

<template>
  <div class="wpe">
	<header class="wpe__header">
	  <h2 class="wpe__title">Body Text (Compare)</h2>
	  <div class="wpe__badges">
		<span class="badge badge--server">Server HTML</span>
		<span class="badge" :class="usedMammoth ? 'badge--mammoth' : 'badge--fallback'">
		  {{ usedMammoth ? 'Mammoth' : 'Mammoth (fallback to server)' }}
		</span>
		<span class="badge" :class="SANITIZE ? 'badge--san-on' : 'badge--san-off'">
		  Sanitization: {{ SANITIZE ? 'ON' : 'OFF' }}
		</span>
	  </div>
	</header>

	<p v-if="error" class="wpe__error">Error: {{ error }}</p>

	<div class="compareFlex">
	  <section class="col">
		<header class="col__header"><h3>Server HTML</h3></header>
		<div class="viewerShell">
		  <EditorContent :editor="editorServer" class="tiptap" />
		</div>
		<details class="dbg">
		  <summary>Raw server HTML</summary>
		  <pre>{{ debugServerHtml }}</pre>
		</details>
	  </section>

	  <section class="col">
		<header class="col__header"><h3>Mammoth (DOCX)</h3></header>
		<div class="viewerShell">
		  <EditorContent :editor="editorMammoth" class="tiptap" />
		</div>

		<details v-if="messages.length" class="messages">
		  <summary>Mammoth messages</summary>
		  <ul>
			<li v-for="(m, i) in messages" :key="i">{{ m.message || m }}</li>
		  </ul>
		</details>

		<details class="dbg">
		  <summary>Raw Mammoth HTML</summary>
		  <pre>{{ debugMammothHtml }}</pre>
		</details>

		<p v-if="mammothError" class="note">
		  Mammoth conversion failed; showing server HTML in the right pane.
		</p>
	  </section>
	</div>
  </div>
</template>

<style>
.wpe { max-width: 1200px; margin: 20px auto; font-family: system-ui, Arial, sans-serif; }
.wpe__header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; }
.wpe__title { margin: 0; font-size: 18px; }
.wpe__badges { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.badge { font-size: .8rem; padding: 2px 8px; border-radius: 999px; border: 1px solid transparent; }
.badge--server { background: #eef2ff; color: #1a237e; border-color: #cbd2ff; }
.badge--mammoth { background: #eef7ee; color: #1b5e20; border-color: #cbe8cb; }
.badge--fallback { background: #fff4e6; color: #7c3e00; border-color: #ffd8b5; }
.badge--san-on { background: #e3f2fd; color: #01579b; border-color: #b3e5fc; }
.badge--san-off { background: #ffebee; color: #b71c1c; border-color: #ffcdd2; }
.wpe__error { color: #b00020; margin: 0 0 10px; }

/* EXACTLY half each */
.compareFlex {
  display: flex;
  gap: 16px;
}
.col {
  flex: 0 0 50%;
  max-width: 50%;
  min-width: 0;            /* keeps columns from overflowing */
  background: #f9f9f9;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
}
.col__header { margin-bottom: 8px; }
.viewerShell { background: #fff; border: 1px solid #ddd; border-radius: 8px; }

.tiptap { min-height: 320px; padding: 12px; }

/* Let the browser handle lists (best for Mammoth output) */
.tiptap ul, .tiptap ol { list-style: revert; padding: revert; margin: revert; }
.tiptap li { display: list-item; }

/* Sensible defaults for DOCX content */
.tiptap .ProseMirror { line-height: 1.5; }
.tiptap img { max-width: 100%; height: auto; display: block; }
.tiptap table { border-collapse: collapse; width: 100%; }
.tiptap th, .tiptap td { border: 1px solid #ccc; padding: 6px; vertical-align: top; }
.tiptap th { background: #f6f6f6; }

.messages { margin-top: 10px; }
.note { margin-top: 8px; color: #555; }
.dbg { margin-top: 10px; }
.dbg pre { white-space: pre-wrap; font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

/* Stack on small screens */
@media (max-width: 1000px) {
  .compareFlex { flex-direction: column; }
  .col { flex: 0 0 auto; max-width: 100%; }
}
</style> -->

<!-- <template>
	<div class="editorPanel">
		<slot>
			<div v-if="hasLoadedContent" class="filePanel__ready">
				<div class="filePanel__header">
					<PkpHeader>
						<h2>{{ t('publication.bodyText') }}</h2>
						<template #actions>
							<PkpButton
								v-if="
									publication.status !== getConstant('STATUS_PUBLISHED') &&
									canEdit
								"
								ref="saveBodyTextButton"
								@click="saveBodyText"
							>
								{{ t('common.save') }}
							</PkpButton>
						</template>
					</PkpHeader>
				</div>
				<div class="filePanel__items">
					<div class="filePanel__fileContent">
						<div v-if="editor" class="container">
							<div class="control-group">
								<div class="button-group">
									<button
										@click="editor.chain().focus().toggleBold().run()"
										:disabled="!editor.can().chain().focus().toggleBold().run()"
										:class="{'is-active': editor.isActive('bold')}"
									>
										Bold
									</button>
									<button
										@click="editor.chain().focus().toggleItalic().run()"
										:disabled="
											!editor.can().chain().focus().toggleItalic().run()
										"
										:class="{'is-active': editor.isActive('italic')}"
									>
										Italic
									</button>
									<button
										@click="editor.chain().focus().toggleStrike().run()"
										:disabled="
											!editor.can().chain().focus().toggleStrike().run()
										"
										:class="{'is-active': editor.isActive('strike')}"
									>
										Strike
									</button>
									<button
										@click="editor.chain().focus().toggleCode().run()"
										:disabled="!editor.can().chain().focus().toggleCode().run()"
										:class="{'is-active': editor.isActive('code')}"
									>
										Code
									</button>
									<button
										@click="editor.chain().focus().setParagraph().run()"
										:class="{'is-active': editor.isActive('paragraph')}"
									>
										Paragraph
									</button>
									<button
										@click="
											editor.chain().focus().toggleHeading({level: 1}).run()
										"
										:class="{
											'is-active': editor.isActive('heading', {level: 1}),
										}"
									>
										H1
									</button>
									<button
										@click="
											editor.chain().focus().toggleHeading({level: 2}).run()
										"
										:class="{
											'is-active': editor.isActive('heading', {level: 2}),
										}"
									>
										H2
									</button>
									<button
										@click="
											editor.chain().focus().toggleHeading({level: 3}).run()
										"
										:class="{
											'is-active': editor.isActive('heading', {level: 3}),
										}"
									>
										H3
									</button>
									<button
										@click="editor.chain().focus().toggleBulletList().run()"
										:class="{'is-active': editor.isActive('bulletList')}"
									>
										Bullet list
									</button>
									<button
										@click="editor.chain().focus().toggleOrderedList().run()"
										:class="{'is-active': editor.isActive('orderedList')}"
									>
										Ordered list
									</button>
									<button
										@click="editor.chain().focus().toggleCodeBlock().run()"
										:class="{'is-active': editor.isActive('codeBlock')}"
									>
										Code block
									</button>
									<button
										@click="editor.chain().focus().toggleBlockquote().run()"
										:class="{'is-active': editor.isActive('blockquote')}"
									>
										Blockquote
									</button>
									<button
										@click="editor.chain().focus().setHorizontalRule().run()"
									>
										Horizontal rule
									</button>
									<button @click="editor.chain().focus().setHardBreak().run()">
										Hard break
									</button>
									<button
										@click="editor.chain().focus().undo().run()"
										:disabled="!editor.can().chain().focus().undo().run()"
									>
										Undo
									</button>
									<button
										@click="editor.chain().focus().redo().run()"
										:disabled="!editor.can().chain().focus().redo().run()"
									>
										Redo
									</button>
								</div>
							</div>
							<div class="tiptap">
								<editor-content :editor="editor" />
							</div>
						</div>
					</div>
				</div>
			</div>
			<div v-else class="filePanel__loading">
				<span class="pkpSpinner" aria-hidden="true"></span>
			</div>
		</slot>
	</div>
</template>

<script>
import ListItem from '@tiptap/extension-list-item';
import { TextStyle } from '@tiptap/extension-text-style'
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import {Editor, EditorContent} from '@tiptap/vue-3';

import {useId} from 'vue';
import PkpButton from '@/components/Button/Button.vue';
import PkpHeader from '@/components/Header/Header.vue';
import ajaxError from '@/mixins/ajaxError';
import dialog from '@/mixins/dialog.js';
import {useUrl} from '@/composables/useUrl';
export default {
	components: {
		PkpButton,
		PkpHeader,
		EditorContent,
	},
	mixins: [ajaxError, dialog],
	props: {
		canEdit: {
			type: Boolean,
			required: true,
		},
		submission: {
			type: Object,
			required: true,
		},
		publication: {
			type: Object,
			required: true,
		},
	},
	mounted() {
		this.editor = new Editor({
			extensions: [
				TextStyle.configure({types: [ListItem.name]}), 
				StarterKit,
				Table.configure({
					resizable: true,
				}),
				TableRow,
				TableHeader,
				TableCell,
			],
			content: '<p>Loading…</p>',
		});
	},
	beforeUnmount() {
		this.editor.destroy();
	},
	data() {
		return {
			isLoading: false,
			isModalOpenedForm: false,
			workingBodyTextProps: [],
			hasLoadedContent: false,
			id: useId(),
			editor: null,
		};
	},
	computed: {
		isDefaultContent() {
			return this.workingBodyTextProps['isDefaultContent'];
		},
		workingBodyTextContent() {
			return this.workingBodyTextProps['bodyTextContent'];
		},
		/**
		 * URL to the API endpoint for the current publication
		 */
		publicationApiUrl() {
			const {apiUrl} = useUrl(this.publicationApiUrlRelative);

			return apiUrl.value;
		},
		publicationApiUrlRelative() {
			return `submissions/${this.submission.id}/publications/${this.publication.id}/bodyText`;
		},
		fileStage() {
			return pkp.const.SUBMISSION_FILE_BODY_TEXT;
		},
	},
	watch: {
		publication(newValue, oldValue) {
			if (newValue != null) {
				this.fetchBodyTextFile();
			}
		},
	},
	created() {
		this.fetchBodyTextFile();
	},
	methods: {
		fetchWorkingBodyTextFile() {
			this.hasLoadedContent = false;
		},
		fetchBodyTextFile() {
			$.ajax({
				url: this.publicationApiUrl,
				type: 'GET',
				context: this,
				headers: {
					'X-Csrf-Token': pkp.currentUser.csrfToken,
				},
				error: this.ajaxErrorCallback,
				success(r) {
					//this.workingBodyTextProps = r;
					this.editor.commands.setContent(r.bodyTextContent);
// 					this.editor.commands.setContent(`
// <h2>
//   Hi there,
// </h2>
// <p>
//   this is a <em>basic</em> example of <strong>Tiptap</strong>. Sure, there are all kind of basic text styles you’d probably expect from a text editor. But wait until you see the lists:
// </p>
// <ul>
//   <li>
//     That’s a bullet list with one …
//   </li>
//   <li>
//     … or two list items.
//   </li>
// </ul>
// <p>
//   Isn’t that great? And all of that is editable. But wait, there’s more. Let’s try a code block:
// </p>
// <pre><code class="language-css">body {
//   display: none;
// }</code></pre>
// <p>
//   I know, I know, this is impressive. It’s only the tip of the iceberg though. Give it a try and click a little bit around. Don’t forget to check the other examples too.
// </p>
// <blockquote>
//   Wow, that’s amazing. Good work, boy! 👏
//   <br />
//   — Mom
// </blockquote>
// `);
					this.hasLoadedContent = true;
				},
			});
		},
		saveBodyText() {
			$.ajax({
				url: this.publicationApiUrl,
				type: 'POST',
				data: {
					fileStage: pkp.const['SUBMISSION_FILE_BODY_TEXT'],
					bodyText: this.editor.getHTML(),
				},
				context: this,
				complete(r) {
					this.hasLoadedContent = true;
				},
				headers: {
					'X-Csrf-Token': pkp.currentUser.csrfToken,
				},
				error: this.ajaxErrorCallback,
				success(r) {},
			});
		},
		/**
		 * Helper method to access a global constant in the template
		 *
		 * @return {Object}
		 */
		getConstant(constant) {
			return pkp.const[constant];
		},
	},
};
</script>

<style lang="less">
@import '../../../../styles/_import';

.editorPanel {
	.filePanel__header {
		grid-column: span 12;
		background: #f3f3f3;
	}

	.filePanel__items {
		grid-column: span 12;
		background: white;
		padding: 20px;
	}

	.filePanel__fileContent {
		background: #f9f9f9;
		padding: 15px;
		border-radius: 5px;
	}

	.center-div {
		text-align: center;
	}

	/* Add responsive design adjustments */
	@media (max-width: 768px) {
		.editorPanel {
			grid-template-columns: repeat(1, 1fr);
		}
	}

	pre {
		white-space: pre-wrap; /* Since CSS 2.1 */
		white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
		white-space: -pre-wrap; /* Opera 4-6 */
		white-space: -o-pre-wrap; /* Opera 7 */
		word-wrap: break-word; /* Internet Explorer 5.5+ */
	}

	.button-group {
		button {
			background-color: #aaaaaa;
			border-radius: 5px;
			padding: 2px;
			margin: 3px;
		}
	}

	/* Basic editor styles */
	.tiptap {
		background-color: #ffffff;

		:first-child {
			margin-top: 0;
		}

		/* List styles */

		ul,
		ol {
			padding: 0 1rem;
			margin: 1.25rem 1rem 1.25rem 0.4rem;

			li p {
				margin-top: 0.25em;
				margin-bottom: 0.25em;
			}

		}

		ul {
			list-style-type: disc;
		}

		ol {
			list-style-type: decimal;
		}

		/* Heading styles */
		h1,
		h2,
		h3 {
			line-height: 1.1;
			margin-top: 2.5rem;
			text-wrap: pretty;
		}

		h1,
		h2 {
			margin-top: 3.5rem;
			margin-bottom: 1.5rem;
		}

		h1 {
			font-size: 1.4rem;
		}

		h2 {
			font-size: 1.2rem;
		}

		h3 {
			font-size: 1.1rem;
		}

		/* Code and preformatted text styles */
		code {
			background-color: var(--purple-light);
			border-radius: 0.4rem;
			color: var(--black);
			font-size: 0.85rem;
			padding: 0.25em 0.3em;
		}

		pre {
			background: var(--black);
			border-radius: 0.5rem;
			color: var(--white);
			font-family: 'JetBrainsMono', monospace;
			margin: 1.5rem 0;
			padding: 0.75rem 1rem;

			code {
				background: none;
				color: inherit;
				font-size: 0.8rem;
				padding: 0;
			}
		}

		blockquote {
			border-left: 3px solid var(--gray-3);
			margin: 1.5rem 0;
			padding-left: 1rem;
		}

		hr {
			border: none;
			border-top: 1px solid var(--gray-2);
			margin: 2rem 0;
		}

		table {
			border-collapse: collapse;
			width: 100%;
		}

		th,
		td {
			border: 1px solid #ccc;
			padding: 6px;
			text-align: left;
		}

		th {
			background-color: #f0f0f0;
		}
	}
}
</style> -->
