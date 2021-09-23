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
            Patcher.before(DiscordModules.Dispatcher, 'dispatch', (o, args, _) => {this._dispatchMiddleware(args)});
            Patcher.before(DiscordModules.MessageStore._dispatcher, 'dispatch', (o, args, _) => {this._dispatchMiddleware(args)});
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

        _dispatchMiddleware(args) {
            const { type } = args[0];
            console.log(args);
            switch(type) {
                case 'MESSAGE_CREATE':
                    this._tryApplySpoiler(args[0].message);
                    break;
                case 'LOAD_MESSAGES_SUCCESS':
                    args[0].messages.forEach(m => this._tryApplySpoiler(m));
                    break;
                case 'MESSAGE_UPDATE':
                    this._tryApplySpoiler(args[0].message);
            }
        }

        _tryApplySpoiler(message) {
            if(!this.settings.toSpoilIds.includes(message.author.id) || (!message.attachments.length && !message.embeds.length))
                return;

            if(message.attachments.length) {
                message.attachments.forEach(att => { att.filename = `SPOILER_${att.filename}` });
            } else {
                message.embeds = message.embeds.filter(e => e.type !== 'image');
            }
        }
    }
}