/**
 * @name Spoilar
 * @invite undefined
 * @authorLink undefined
 * @donate undefined
 * @patreon undefined
 * @website https://github.com/AlexPresso/Spoilar-bd-plugin
 * @source https://raw.githubusercontent.com/AlexPresso/Spoilar-bd-plugin/blob/main/release/Spoilar.plugin.js
 */
/*@cc_on
@if (@_jscript)
    
    // Offer to self-install for clueless users that try to run this directly.
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
    var pathSelf = WScript.ScriptFullName;
    // Put the user at ease by addressing them in the first person
    shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
    if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
        shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
    } else if (!fs.FolderExists(pathPlugins)) {
        shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
    } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
        fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
        // Show the user where to put plugins in the future
        shell.Exec("explorer " + pathPlugins);
        shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
    }
    WScript.Quit();

@else@*/

module.exports = (() => {
    const config = {"info":{"name":"Spoilar","authors":[{"name":"Alex'Presso","discord_id":"168436075058954240","github_username":"AlexPresso"}],"version":"1.3","description":"A plugin used to put all medias sent by some Discord users under spoiler tags.","github":"https://github.com/AlexPresso/Spoilar-bd-plugin","github_raw":"https://raw.githubusercontent.com/AlexPresso/Spoilar-bd-plugin/blob/main/release/Spoilar.plugin.js"},"changelog":[{"title":"v1.2 Improvements","items":["Add embed spoil option","Add message content spoil option","Add attachment spoil option"]}],"main":"index.js"};

    return !global.ZeresPluginLibrary ? class {
        constructor() {this._config = config;}
        getName() {return config.info.name;}
        getAuthor() {return config.info.authors.map(a => a.name).join(", ");}
        getDescription() {return config.info.description;}
        getVersion() {return config.info.version;}
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {
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
};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/