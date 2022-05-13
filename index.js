module.exports = (Plugin, Library) => {
    const { Logger, Settings, Patcher, DiscordModules } = Library;

    return class Spoilar extends Plugin {
        constructor() {
            super();
            this.defaultSettings = {
                toSpoilIds: "",
                spoilAttachments: true,
                spoilEmbeds: true,
                spoilMessageContent: false
            };
        }

        onStart() {
            Patcher.before(DiscordModules.Dispatcher, 'dispatch', (o, args, _) => {this._dispatchMiddleware(args)});
            Patcher.before(DiscordModules.MessageStore._dispatcher, 'dispatch', (o, args, _) => {this._messageStoreMiddleware(args)});
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
                ),
                new Settings.Switch(
                    "Spoil Attachments",
                    "",
                    this.settings.spoilAttachments,
                    v => { this.settings.spoilAttachments = v }
                ),
                new Settings.Switch(
                    "Spoil Embeds",
                    "",
                    this.settings.spoilEmbeds,
                    v => { this.settings.spoilEmbeds = v }
                ),
                new Settings.Switch(
                    "Spoil Message Content",
                    "",
                    this.settings.spoilMessageContent,
                    v => { this.settings.spoilMessageContent = v }
                )
            )
        }

        _dispatchMiddleware(args) {
            const { type } = args[0];
            switch(type) {
                case 'MESSAGE_CREATE':
                case 'MESSAGE_UPDATE':
                    this._tryApplySpoiler(args[0].message);
                    break;
            }
        }
        _messageStoreMiddleware(args) {
            const { type } = args[0];
            if(type !== 'LOAD_MESSAGES_SUCCESS')
                return;

            args[0].messages.forEach(m => this._tryApplySpoiler(m));
        }

        _tryApplySpoiler(message) {
            if(!this.settings.toSpoilIds.includes(message.author.id))
                return;

            if(this.settings.spoilAttachments && message.attachments.length)
                message.attachments.forEach(att => { att.filename = `SPOILER_${att.filename}` });
            if(this.settings.spoilEmbeds)
                message.embeds = [];
            if(this.settings.spoilMessageContent && message.content && !(message.content.startsWith("||") && message.content.endsWith("||")))
                message.content = `||${message.content}||`;
        }
    }
}
