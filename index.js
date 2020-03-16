// Params: channelId, showTime, title (variables: {user}, {reward}, {price})

const ChatClient = require("twitch-chat-client").default;

let params;
(window.onpopstate = function () {
    let match,
        pl = /\+/g,
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query = window.location.search.substring(1);

    params = {};
    while (match = search.exec(query))
        params[decode(match[1])] = decode(match[2]);
})();

function sleep(miliseconds) {
    return new Promise(res => {
        setTimeout(res, miliseconds)
    });
}

function replaceAll(text, find, replaceWith) {
    let re = new RegExp(find, "g");
    return text.replace(re, replaceWith);
}

window.onload = () => {
    const container = document.getElementById("points-notification-container");
    const image = document.getElementById("points-notification-image");
    const title = document.getElementById("points-notification-title");
    const message = document.getElementById("points-notification-message");
    
    let textStyle = "";
    
    if (params.textColor) {
        textStyle += `color: ${params.textColor};`;
    } else {
        textStyle += "color: white;";
    }
    if (params.textSize) {
        textStyle += `font-size: ${params.textSize};`;
    } else {
        textStyle += "font-size: 18px;";
    }
    if (params.textStyle) {
        textStyle += params.textStyle;
    }

    message.setAttribute("style", textStyle);

    let titleStyle = "";
    if (params.titleColor) {
        titleStyle += `color: ${params.titleColor};`;
    } else {
        titleStyle += "color: white;";
    }
    if (params.titleSize) {
        titleStyle += `font-size: ${params.titleSize};`;
    } else {
        titleStyle += "font-size: 25px;";
    }
    if (params.titleStyle) {
        titleStyle += params.titleStyle;
    }
    title.setAttribute("style", titleStyle);

    if (params.imageStyle) {
        image.setAttribute("style", params.imageStyle);
    }

    let showPrices = [];
    let audioPrices = [];
    let ttsPrices = [];

    if (params.showPrices) {
        let items = params.showPrices.split(",");
        for (item of items) {
            showPrices.push(parseInt(item));
        }
    }

    if (params.audioPrices) {
        let items = params.audioPrices.split(",");
        for (item of items) {
            audioPrices.push(parseInt(item));
        }
    }

    if (params.ttsPrices) {
        let items = params.ttsPrices.split(",");
        for (item of items) {
            ttsPrices.push(parseInt(item));
        }
    }

    if (params.botChannelName) {
        (async () => {
            let chatClient = new ChatClient()

            chatClient.onPrivmsg((_, user, message, msg) => {
                if (msg.tags.get("msg-id") === "highlighted-message") {
                    notifications.push({
                        image: "https://static-cdn.jtvnw.net/automatic-reward-images/highlight-4.png",
                        title: params.highlightTitle ? params.highlightTitle : "Highlight My Message",
                        price: params.highlightPrice ? parseInt(params.highlightPrice) : 500,
                        user: user,
                        text: message,
                    });
                }
            })
            chatClient.onRegister(async () => await chatClient.join(params.botChannelName))
            await chatClient.connect();
        })()
    }

    let ws = undefined;
    let pong = false;
    let interval = false;

    let notifications = [];

    let notificationShowing = false;
    setInterval(async () => {
        if (!notificationShowing && notifications.length > 0) {
            let notif = notifications.pop();
            console.log("Notification showing", notif);
            if (showPrices.length !== 0 && showPrices.indexOf(notif.price) === -1)
                return;
            console.log("Price check passed");
            notificationShowing = true;
            image.setAttribute("style", `background-image: url("${notif.image}")`);
            title.innerText = params.title ? replaceAll(replaceAll(replaceAll(params.title, "{user}", notif.user), "{reward}", notif.title), "{price}", notif.price) : `${notif.user} spent ${notif.price} on ${notif.title}`;
            message.innerText = notif.text;
            container.setAttribute("class", "");
            if (params.audioUrl && (audioPrices.length === 0 || audioPrices.indexOf(notif.price) !== -1)) {
                console.log("Playing audio", params.audioUrl);
                try {
                    audio = new Audio();
                    audio.src = params.audioUrl;
                    audio.volume = params.audioVolume ? parseFloat(params.audioVolume) : 1;
                    audio.play();
                    await new Promise((res) => {
                        audio.onended = res;
                        audio.onerror = (e) => { console.log(e); res() };
                    })
                } catch (e) {
                    console.log("Audio playback error:", e)
                }
            }
            if (params.tts && (ttsPrices.length === 0 || ttsPrices.indexOf(notif.price) !== -1)) {
                console.log("Playing TTS");
                try {
                    await GoogleTTS.textToSpeech(notif.text, params.ttsLang ? params.ttsLang : "en");
                    console.log("TTS ended");
                } catch (e) {
                    console.log("TTS error:", e)
                }
            }
            await sleep(parseInt(params.showTime ? params.showTime : 7500));
            notificationShowing = true;
            container.setAttribute("class", "hide");
        }
    }, 1000);

    function connect() {
        ws = new WebSocket("wss://pubsub-edge.twitch.tv");
        listen();
    }
    function disconnect() {
        if (interval) {
            clearInterval(interval);
            interval = false;
        }
        ws.close();
    }

    function listen() {
        ws.onmessage = (a) => {
            let o = JSON.parse(a.data);
            switch (o.type) {
                case "PING":
                    ws.send(JSON.stringify({
                        "type": "PONG"
                    }));
                    break;
                case "PONG":
                    pong = true;
                    break;
                case "RECONNECT":
                    disconnect();
                    connect();
                    break;
                case "RESPONCE":
                    console.log("PubSub responce ", o.error)
                    break;
                case "MESSAGE":
                    switch (o.data.topic) {
                        case `community-points-channel-v1.${params.channelId}`:
                            let msg = JSON.parse(o.data.message);
                            console.log(msg);
                            switch (msg.type) {
                                case "reward-redeemed":
                                    let reward = msg.data.redemption.reward;
                                    let imageUrl = undefined;

                                    let img = reward.image;
                                    let defimg = reward.default_image;

                                    if (img) {
                                        if (img.url_4x) {
                                            imageUrl = img.url_4x;
                                        } else if (img.url_2x) {
                                            imageUrl = img.url_2x;
                                        } else if (img.url_1x) {
                                            imageUrl = img.url_1x;
                                        }
                                    } else if (defimg) {
                                        if (defimg.url_4x) {
                                            imageUrl = defimg.url_4x;
                                        } else if (defimg.url_2x) {
                                            imageUrl = defimg.url_2x;
                                        } else if (defimg.url_1x) {
                                            imageUrl = defimg.url_1x;
                                        }
                                    }
                                    else {
                                        imageUrl = params.defImg ? params.defImg : "https://static-cdn.jtvnw.net/custom-reward-images/default-4.png"
                                    }
                                    let notif = {
                                        image: imageUrl,
                                        title: reward.title,
                                        price: reward.cost,
                                        user: msg.data.redemption.user.display_name,
                                        text: msg.data.redemption.user_input,
                                    };
                                    console.log("Notification queued", notif);
                                    notifications.push(notif);
                                    break;
                            }
                            break;
                    }
                    break;
            }
        }
        ws.onopen = () => {
            ws.send(JSON.stringify({ "type": "LISTEN", "nonce": "pepega", "data": { "topics": ["community-points-channel-v1." + params.channelId], "auth_token": "" } }));
            interval = setInterval(async () => {
                ws.send(JSON.stringify({
                    "type": "PING"
                }));
                await sleep(5000);
                if (pong) {
                    pong = false;
                }
                else {
                    pong = false;
                    disconnect();
                    connect();
                }
            }, 5 * 60 * 1000)
        }
    }

    connect();
}
