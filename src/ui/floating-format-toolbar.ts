import { Editor, MarkdownView, Menu, Platform, Plugin } from 'obsidian';
import {
	applyCallout,
	applyMarkdownLink,
	lowercaseSelection,
	titleCaseSelection,
	toggleBold,
	toggleBulletList,
	toggleCodeBlock,
	toggleComment,
	toggleHighlight,
	toggleInlineCode,
	toggleItalic,
	toggleNumberedList,
	toggleQuote,
	toggleStrikethrough,
	toggleTaskList,
	toggleUnderline,
	toggleWikilink,
	uppercaseSelection,
} from '../formatting/markdown-formatting';
import { extractSelectionToNote } from '../notes/extract-selection';
import type { ToolbarButtonId, ToolbarPosition } from '../settings';
import { promptForUrl } from './url-prompt-modal';

const SELECTION_GAP = 8;
// Clears the selection handles that phones draw under the selected text.
const MOBILE_GAP_BELOW = 32;
const EDGE_MARGIN = 8;

export interface FloatingFormatToolbarOptions {
	isVisible: () => boolean;
	getPosition: () => ToolbarPosition;
	getButtons: () => ToolbarButtonId[];
}

export class FloatingFormatToolbar {
	private el: HTMLElement;
	private plugin: Plugin;
	private options: FloatingFormatToolbarOptions;
	private lastEditor: Editor | null = null;
	private frame: number | null = null;
	private buttons = new Map<ToolbarButtonId, HTMLElement>();

	constructor(plugin: Plugin, options: FloatingFormatToolbarOptions) {
		this.plugin = plugin;
		this.options = options;
		this.el = activeDocument.body.createDiv({
			cls: 'selection-toolbar',
		});

		this.el.hide();
		this.buildButtons();
		this.registerEvents();
	}

	private buildButtons() {
		this.addButton('bold', 'B', 'Bold', () => this.run(toggleBold), 'is-bold');
		this.addButton(
			'italic',
			'I',
			'Italic',
			() => this.run(toggleItalic),
			'is-italic',
		);
		this.addButton(
			'underline',
			'U',
			'Underline',
			() => this.run(toggleUnderline),
			'is-underlined',
		);
		this.addButton(
			'strikethrough',
			'S',
			'Strikethrough',
			() => this.run(toggleStrikethrough),
			'is-struck',
		);
		this.addButton('highlight', 'H', 'Highlight', () =>
			this.run(toggleHighlight),
		);
		this.addButton('inline-code', '`', 'Inline code', () =>
			this.run(toggleInlineCode),
		);
		this.addButton('wikilink', '[[', 'Wikilink', () =>
			this.run(toggleWikilink),
		);
		this.addButton('link', 'Link', 'Markdown link', () =>
			this.promptForLink(),
		);
		this.addButton('more', '...', 'More actions', (event) =>
			this.showMoreActions(event),
		);
	}

	private addButton(
		id: ToolbarButtonId,
		label: string,
		ariaLabel: string,
		callback: (event: MouseEvent) => void,
		modifierClass?: string,
	) {
		const button = this.el.createEl('button', { text: label });
		button.ariaLabel = ariaLabel;
		button.addClass('selection-toolbar-button');
		this.buttons.set(id, button);
		if (modifierClass) {
			button.addClass(modifierClass);
		}

		button.addEventListener('mousedown', (event) => {
			event.preventDefault();
		});

		button.addEventListener('click', (event) => {
			event.preventDefault();
			callback(event);
		});
	}

	private promptForLink() {
		const editor = this.lastEditor;
		if (!editor) {
			return;
		}

		promptForUrl(this.plugin.app, (url) => {
			applyMarkdownLink(editor, url);
			editor.focus();
		});
		this.hide();
	}

	private showMoreActions(event: MouseEvent) {
		const editor = this.lastEditor;
		if (!editor) {
			return;
		}

		const menu = new Menu();

		this.addMenuAction(menu, editor, 'Comment', 'message-square', toggleComment);
		this.addMenuAction(menu, editor, 'Quote block', 'quote', toggleQuote);
		this.addMenuAction(menu, editor, 'Bullet list', 'list', toggleBulletList);
		this.addMenuAction(
			menu,
			editor,
			'Numbered list',
			'list-ordered',
			toggleNumberedList,
		);
		this.addMenuAction(menu, editor, 'Task list', 'list-checks', toggleTaskList);
		this.addMenuAction(menu, editor, 'Code block', 'code-2', toggleCodeBlock);
		menu.addSeparator();
		this.addMenuAction(menu, editor, 'Callout: note', 'notebook', (activeEditor) =>
			applyCallout(activeEditor, 'note'),
		);
		this.addMenuAction(menu, editor, 'Callout: tip', 'lightbulb', (activeEditor) =>
			applyCallout(activeEditor, 'tip'),
		);
		this.addMenuAction(
			menu,
			editor,
			'Callout: warning',
			'triangle-alert',
			(activeEditor) => applyCallout(activeEditor, 'warning'),
		);
		menu.addSeparator();
		this.addMenuAction(
			menu,
			editor,
			'Uppercase',
			'case-upper',
			uppercaseSelection,
		);
		this.addMenuAction(
			menu,
			editor,
			'Lowercase',
			'case-lower',
			lowercaseSelection,
		);
		this.addMenuAction(
			menu,
			editor,
			'Title case',
			'type',
			titleCaseSelection,
		);
		menu.addSeparator();
		this.addMenuAction(
			menu,
			editor,
			'Extract to note',
			'file-symlink',
			(activeEditor) =>
				extractSelectionToNote(this.plugin.app, activeEditor),
		);

		menu.showAtMouseEvent(event);
	}

	private addMenuAction(
		menu: Menu,
		editor: Editor,
		title: string,
		icon: string,
		formatter: (editor: Editor) => void | Promise<void>,
	) {
		menu.addItem((item) => {
			item.setTitle(title)
				.setIcon(icon)
				.onClick(() => {
					void this.runWithEditor(editor, formatter);
				});
		});
	}

	private registerEvents() {
		this.plugin.registerDomEvent(activeDocument, 'selectionchange', () =>
			this.scheduleUpdate(),
		);

		this.plugin.registerDomEvent(activeDocument, 'mouseup', () =>
			this.scheduleUpdate(),
		);

		this.plugin.registerDomEvent(activeDocument, 'keyup', () =>
			this.scheduleUpdate(),
		);

		this.plugin.registerDomEvent(activeDocument, 'focusout', () =>
			this.scheduleUpdate(),
		);

		this.plugin.registerDomEvent(
			activeDocument,
			'scroll',
			() => this.scheduleUpdate(),
			{ capture: true },
		);

		this.plugin.registerDomEvent(activeWindow, 'resize', () => this.hide());

		const { workspace } = this.plugin.app;
		this.plugin.registerEvent(
			workspace.on('active-leaf-change', () => this.scheduleUpdate()),
		);
		this.plugin.registerEvent(
			workspace.on('file-open', () => this.scheduleUpdate()),
		);
		this.plugin.registerEvent(
			workspace.on('layout-change', () => this.scheduleUpdate()),
		);

		this.plugin.register(() => this.destroy());
	}

	private scheduleUpdate() {
		if (this.frame !== null) {
			window.cancelAnimationFrame(this.frame);
		}

		this.frame = window.requestAnimationFrame(() => {
			this.frame = null;
			this.update();
		});
	}

	private update() {
		if (!this.options.isVisible() || !this.applyButtonVisibility()) {
			this.hide();
			return;
		}

		const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = view?.editor;

		if (!view || !editor?.hasFocus() || !editor.getSelection().trim()) {
			this.hide();
			return;
		}

		const range = activeWindow.getSelection()?.rangeCount
			? activeWindow.getSelection()?.getRangeAt(0)
			: null;

		if (!range || !view.contentEl.contains(range.commonAncestorContainer)) {
			this.hide();
			return;
		}

		const rect = range.getBoundingClientRect();

		if (rect.bottom < 0 || rect.top > activeWindow.innerHeight) {
			this.hide();
			return;
		}

		this.lastEditor = editor;
		this.el.show();
		this.place(rect);
	}

	private place(selection: DOMRect) {
		const width = this.el.offsetWidth;
		const height = this.el.offsetHeight;
		const viewportWidth = activeWindow.innerWidth;
		const viewportHeight = activeWindow.innerHeight;
		const gapBelow = Platform.isMobile ? MOBILE_GAP_BELOW : SELECTION_GAP;

		const aboveTop = selection.top - SELECTION_GAP - height;
		const belowTop = selection.bottom + gapBelow;
		const fitsAbove = aboveTop >= EDGE_MARGIN;
		const fitsBelow = belowTop + height <= viewportHeight - EDGE_MARGIN;
		const below =
			this.options.getPosition() === 'below'
				? fitsBelow || !fitsAbove
				: !fitsAbove && fitsBelow;

		const left = selection.left + selection.width / 2 - width / 2;

		this.el.style.left = `${clamp(left, EDGE_MARGIN, viewportWidth - width - EDGE_MARGIN)}px`;
		this.el.style.top = `${clamp(below ? belowTop : aboveTop, EDGE_MARGIN, viewportHeight - height - EDGE_MARGIN)}px`;
	}

	/** Shows only the enabled buttons; returns false when none are enabled. */
	private applyButtonVisibility() {
		const enabled = this.options.getButtons();

		for (const [id, button] of this.buttons) {
			button.toggle(enabled.includes(id));
		}

		return enabled.length > 0;
	}

	private run(formatter: (editor: Editor) => void | Promise<void>) {
		const editor = this.lastEditor;
		if (!editor) {
			return;
		}

		void this.runWithEditor(editor, formatter);
	}

	private async runWithEditor(
		editor: Editor,
		formatter: (editor: Editor) => void | Promise<void>,
	) {
		await formatter(editor);
		editor.focus();
		this.hide();
	}

	private hide() {
		this.el.hide();
		this.lastEditor = null;
	}

	private destroy() {
		if (this.frame !== null) {
			window.cancelAnimationFrame(this.frame);
		}

		this.el.remove();
	}
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), Math.max(min, max));
}
