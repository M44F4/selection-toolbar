import { App, Platform, PluginSettingTab, Setting } from 'obsidian';
import type SelectionToolbarPlugin from './main';

export type ToolbarVisibility = 'everywhere' | 'desktop' | 'mobile' | 'never';

export interface SelectionToolbarSettings {
	toolbarVisibility: ToolbarVisibility;
}

export const DEFAULT_SETTINGS: SelectionToolbarSettings = {
	toolbarVisibility: 'everywhere',
};

const VISIBILITY_OPTIONS: Record<ToolbarVisibility, string> = {
	everywhere: 'Everywhere',
	desktop: 'Desktop only',
	mobile: 'Mobile only',
	never: 'Never',
};

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
	}
}
