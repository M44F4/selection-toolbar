import { Plugin } from 'obsidian';
import { registerFormattingCommands } from './commands/formatting-commands';
import {
	DEFAULT_SETTINGS,
	getToolbarPosition,
	isToolbarVisible,
	SelectionToolbarSettings,
	SelectionToolbarSettingTab,
} from './settings';
import { FloatingFormatToolbar } from './ui/floating-format-toolbar';

export default class SelectionToolbarPlugin extends Plugin {
	settings!: SelectionToolbarSettings;
	private formatToolbar!: FloatingFormatToolbar;

	async onload() {
		await this.loadSettings();

		this.formatToolbar = new FloatingFormatToolbar(this, {
			isVisible: () => isToolbarVisible(this.settings.toolbarVisibility),
			getPosition: () => getToolbarPosition(this.settings),
		});
		registerFormattingCommands(this);
		this.addSettingTab(new SelectionToolbarSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<SelectionToolbarSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
