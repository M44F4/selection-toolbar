import { Editor, MarkdownView, Menu, Plugin } from 'obsidian';
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
import { promptForUrl } from './url-prompt-modal';

export class FloatingFormatToolbar {
	private el: HTMLElement;
	private plugin: Plugin;
	private isEnabled: () => boolean;
	private lastEditor: Editor | null = null;
	private frame: number | null = null;

	constructor(plugin: Plugin, isEnabled: () => boolean) {
		this.plugin = plugin;
		this.isEnabled = isEnabled;
		this.el = activeDocument.body.createDiv({
			cls: 'selection-toolbar',
		});

		this.el.hide();
		this.buildButtons();
		this.registerEvents();
	}

	private buildButtons() {
		this.addButton('B', 'Bold', () => this.run(toggleBold), 'is-bold');
		this.addButton('I', 'Italic', () => this.run(toggleItalic), 'is-italic');
		this.addButton(
			'U',
			'Underline',
			() => this.run(toggleUnderline),
			'is-underlined',
		);
		this.addButton(
			'S',
			'Strikethrough',
			() => this.run(toggleStrikethrough),
			'is-struck',
		);
		this.addButton('H', 'Highlight', () => this.run(toggleHighlight));
		this.addButton('`', 'Inline code', () => this.run(toggleInlineCode));
		this.addButton('[[', 'Wikilink', () => this.run(toggleWikilink));
		this.addButton('Link', 'Markdown link', () => this.promptForLink());
		this.addButton('...', 'More actions', (event) =>
			this.showMoreActions(event),
		);
	}

	private addButton(
		label: string,
		ariaLabel: string,
		callback: (event: MouseEvent) => void,
		modifierClass?: string,
	) {
		const button = this.el.createEl('button', { text: label });
		button.ariaLabel = ariaLabel;
		button.addClass('selection-toolbar-button');
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

		this.plugin.registerDomEvent(activeWindow, 'resize', () => this.hide());

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
		if (!this.isEnabled()) {
			this.hide();
			return;
		}

		const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = view?.editor;

		if (!editor || !editor.getSelection().trim()) {
			this.hide();
			return;
		}

		const range = activeWindow.getSelection()?.rangeCount
			? activeWindow.getSelection()?.getRangeAt(0)
			: null;

		if (!range) {
			this.hide();
			return;
		}

		const rect = range.getBoundingClientRect();

		this.lastEditor = editor;
		this.el.show();
		this.el.style.left = `${rect.left + rect.width / 2}px`;
		this.el.style.top = `${rect.top}px`;
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
