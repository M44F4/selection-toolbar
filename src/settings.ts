import { App, Platform, PluginSettingTab, Setting } from 'obsidian';
import type SelectionToolbarPlugin from './main';

export type ToolbarVisibility = 'everywhere' | 'desktop' | 'mobile' | 'never';

export type ToolbarPosition = 'above' | 'below';

export type ToolbarButtonId =
	| 'bold'
	| 'italic'
	| 'underline'
	| 'strikethrough'
	| 'highlight'
	| 'inline-code'
	| 'wikilink'
	| 'link'
	| 'more';

type ButtonListKey = 'desktopButtons' | 'mobileButtons';

type PositionKey = 'desktopPosition' | 'mobilePosition';

export interface SelectionToolbarSettings {
	toolbarVisibility: ToolbarVisibility;
	desktopPosition: ToolbarPosition;
	mobilePosition: ToolbarPosition;
	desktopButtons: ToolbarButtonId[];
	mobileButtons: ToolbarButtonId[];
}

export const DEFAULT_SETTINGS: SelectionToolbarSettings = {
	toolbarVisibility: 'everywhere',
	desktopPosition: 'above',
	mobilePosition: 'below',
	desktopButtons: [
		'bold',
		'italic',
		'underline',
		'strikethrough',
		'highlight',
		'inline-code',
		'wikilink',
		'link',
		'more',
	],
	mobileButtons: ['highlight', 'wikilink', 'more'],
};

const VISIBILITY_OPTIONS: Record<ToolbarVisibility, string> = {
	everywhere: 'Everywhere',
	desktop: 'Desktop only',
	mobile: 'Mobile only',
	never: 'Never',
};

const POSITION_OPTIONS: Record<ToolbarPosition, string> = {
	above: 'Above selection',
	below: 'Below selection',
};

const TOOLBAR_BUTTONS: Record<ToolbarButtonId, { label: string; name: string }> =
	{
		bold: { label: 'B', name: 'Bold' },
		italic: { label: 'I', name: 'Italic' },
		underline: { label: 'U', name: 'Underline' },
		strikethrough: { label: 'S', name: 'Strikethrough' },
		highlight: { label: 'H', name: 'Highlight' },
		'inline-code': { label: '`', name: 'Inline code' },
		wikilink: { label: '[[', name: 'Wikilink' },
		link: { label: 'Link', name: 'Markdown link' },
		more: { label: '...', name: 'More actions menu' },
	};

export function getToolbarButtons(settings: SelectionToolbarSettings) {
	return Platform.isMobile ? settings.mobileButtons : settings.desktopButtons;
}

export function getToolbarPosition(settings: SelectionToolbarSettings) {
	return Platform.isMobile ? settings.mobilePosition : settings.desktopPosition;
}

export function isToolbarVisible(visibility: ToolbarVisibility) {
	switch (visibility) {
		case 'everywhere':
			return true;
		case 'desktop':
			return !Platform.isMobile;
		case 'mobile':
			return Platform.isMobile;
		case 'never':
			return false;
	}
}

export class SelectionToolbarSettingTab extends PluginSettingTab {
	private plugin: SelectionToolbarPlugin;

	constructor(app: App, plugin: SelectionToolbarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Show floating toolbar')
			.setDesc('Commands work in every mode.')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(VISIBILITY_OPTIONS)
					.setValue(this.plugin.settings.toolbarVisibility)
					.onChange(async (value) => {
						this.plugin.settings.toolbarVisibility =
							value as ToolbarVisibility;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl).setName('Desktop').setHeading();
		this.addPositionSetting('desktopPosition');
		this.addButtonToggles('desktopButtons');

		new Setting(containerEl).setName('Mobile').setHeading();
		this.addPositionSetting(
			'mobilePosition',
			'Below avoids the system selection menu.',
		);
		this.addButtonToggles('mobileButtons');
	}

	private addPositionSetting(key: PositionKey, desc?: string) {
		const setting = new Setting(this.containerEl)
			.setName('Position')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(POSITION_OPTIONS)
					.setValue(this.plugin.settings[key])
					.onChange(async (value) => {
						this.plugin.settings[key] = value as ToolbarPosition;
						await this.plugin.saveSettings();
					}),
			);
		if (desc) {
			setting.setDesc(desc);
		}
	}

	private addButtonToggles(key: ButtonListKey) {
		const setting = new Setting(this.containerEl)
			.setName('Buttons')
			.setDesc('Tap to show or hide.');
		setting.controlEl.addClass('selection-toolbar-chips');

		for (const [id, button] of Object.entries(TOOLBAR_BUTTONS) as [
			ToolbarButtonId,
			{ label: string; name: string },
		][]) {
			const chip = setting.controlEl.createEl('button', {
				text: button.label,
				cls: 'selection-toolbar-chip',
			});
			chip.ariaLabel = button.name;

			const render = () => {
				const isOn = this.plugin.settings[key].includes(id);
				chip.toggleClass('is-active', isOn);
				chip.setAttr('aria-pressed', String(isOn));
			};
			render();

			chip.addEventListener('click', () => {
				const enabled = new Set(this.plugin.settings[key]);
				if (enabled.has(id)) {
					enabled.delete(id);
				} else {
					enabled.add(id);
				}
				this.plugin.settings[key] = (
					Object.keys(TOOLBAR_BUTTONS) as ToolbarButtonId[]
				).filter((buttonId) => enabled.has(buttonId));
				render();
				void this.plugin.saveSettings();
			});
		}
	}
}
