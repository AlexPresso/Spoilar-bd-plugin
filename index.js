module.exports = (Plugin, Library) => {
    const { Logger, Settings, Patcher, DiscordModules } = Library;

    return class Spoilar extends Plugin {
        constructor() {
            super();
            this.defaultSettings = {
                toSpoilIds: ""
            };
        }

        onStart() {
            Patcher.before(DiscordModules.Dispatcher, 'dispatch', (o, args, _) => {this._tryApplySpoiler(args)});
            Logger.log("Started.");
        }

        onStop() {
            Patcher.unpatchAll();
            Logger.log("Stopped.");
        }

        getSettingsPanel() {
            return Settings.SettingPanel.build(
                this.saveSettings.bind(this),
                new Settings.Textbox(
                    "User IDs",
                    "Add all IDs of users you want medias to be forced into spoiler tags (comma separated)",
                    this.settings.toSpoilIds,
                    v => { this.settings.toSpoilIds = v },
                    { placeholder: "168436075058954240,168436075058954241" }
                )
            )
        }

        _tryApplySpoiler(args) {
            const { type } = args[0];
            if(type !== 'MESSAGE_CREATE')
                return;

            const { message } = args[0];
            if(!this.settings.toSpoilIds.includes(message.author.id) || !message.attachments.length)
                return;

            message.attachments[0].filename = `SPOILER_${message.attachments[0].filename}`;

            return args;
        }
    }
}