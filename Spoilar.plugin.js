/**
 * @name Spoilar
 * @author alexpresso
 * @description Spoils content from specific user IDs (attachments, embeds, text).
 * @version 2.0.0
 * @source https://github.com/AlexPresso/Spoilar-bd-plugin/tree/main
 * @updateUrl https://raw.githubusercontent.com/AlexPresso/Spoilar-bd-plugin/refs/heads/main/release/Spoilar.plugin.js
 */

module.exports = meta => {
    const { Patcher, Logger, Webpack } = BdApi;

    const Dispatcher = Webpack.getByKeys("dispatch", "subscribe");
    const UserStore = Webpack.getStore("UserStore");
    const hookedEvents = new Set(["MESSAGE_CREATE", "MESSAGE_DELETE", "LOAD_MESSAGES_SUCCESS"]);
    const plugin = new BdApi(meta.name);

    const defaultConfig = {
        "sUserIds": "",
        "bAttachments": true,
        "bEmbeds": true,
        "bContent": true
    };

    const loadConfig = () => {
        plugin.config = Object.fromEntries(
            Object.entries(defaultConfig).map(([k, v]) => [k, plugin.Data.load(k) ?? v])
        );
    }

    const dispatchMiddleware = (o, args) => {
        const event = args[0];
        if(!hookedEvents.has(event.type))
            return;

        tryApplySpoiler([event.message, ...(event.messages || [])]);
    }

    const tryApplySpoiler = messages => {
        for(const message of messages) {
            if(!message || plugin.config.selfId === message.author.id || plugin.config.sUserIds.includes(message.author.id))
                continue;

            if(plugin.config.bAttachments && message.attachments.length)
                message.attachments.forEach(att => { att.filename = `SPOILER_${att.filename}` });
            if(plugin.config.bEmbeds)
                message.embeds = [];
            if(plugin.config.bContent && message.content && !(message.content.startsWith("||") && message.content.endsWith("||")))
                message.content = `||${message.content}||`;
        }
    }

    return {
        getSettingsPanel: () => plugin.UI.buildSettingsPanel({
            settings: [
                {id: "sUserIds", type: "text", name: "User IDs", note: "Add all IDs of users you want to whitelist from forced spoiler tags (comma separated)", value: plugin.config.sUserIds},
                {id: "bAttachments", type: "switch", name: "Spoil Attachments", value: plugin.config.bAttachments},
                {id: "bEmbeds", type: "switch", name: "Spoil Embeds", value: plugin.config.bEmbeds},
                {id: "bContent", type: "switch", name: "Spoil Message content", value: plugin.config.bContent},
            ],
            onChange: (_, id, value) => {plugin.Data.save(id, value); plugin.config[id] = value;}
        }),
        start: () => {
            loadConfig();
            plugin.config.selfId = UserStore.getCurrentUser().id;

            Patcher.before(meta.name, Dispatcher, "dispatch", dispatchMiddleware);
            Logger.info(meta.name, `Plugin v${meta.version} started.`);
        },
        stop: () => {
            Patcher.unpatchAll(meta.name);
            Logger.info(meta.name, "Plugin stopped.");
        }
    }
}
