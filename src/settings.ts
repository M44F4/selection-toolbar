import { App, Platform, PluginSettingTab, Setting } from 'obsidian';
import type SelectionToolbarPlugin from './main';

export type ToolbarVisibility = 'everywhere' | 'desktop' | 'mobile' | 'never';

export type ToolbarPosition = 'above' | 'below';

export interface SelectionToolbarSettings {
	toolbarVisibility: ToolbarVisibility;
	desktopPosition: ToolbarPosition;
	mobilePosition: ToolbarPosition;
}

export const DEFAULT_SETTINGS: SelectionToolbarSettings = {
	toolbarVisibility: 'everywhere',
	desktopPosition: 'above',
	mobilePosition: 'below',
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
			.setDesc(
				'Where the toolbar appears when text is selected. Commands stay available either way.',
			)
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

		new Setting(containerEl)
			.setName('Position on desktop')
			.setDesc('Where the toolbar appears relative to the selection.')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(POSITION_OPTIONS)
					.setValue(this.plugin.settings.desktopPosition)
					.onChange(async (value) => {
						this.plugin.settings.desktopPosition =
							value as ToolbarPosition;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Position on mobile')
			.setDesc(
				'Below can keep the toolbar clear of the system selection menu.',
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(POSITION_OPTIONS)
					.setValue(this.plugin.settings.mobilePosition)
					.onChange(async (value) => {
						this.plugin.settings.mobilePosition =
							value as ToolbarPosition;
						await this.plugin.saveSettings();
					}),
			);
	}
}
