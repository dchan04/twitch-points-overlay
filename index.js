// Params: channelId, showTime, title (variables: {user}, {reward}, {price})

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

    let ws = undefined;
    let pong = false;
    let interval = false;

    let notifications = [];

    let notificationShowing = false;
    setInterval(async () => {
        if (!notificationShowing && notifications.length > 0) {
            let notif = notifications.pop();
            if (showPrices.length !== 0 && showPrices.indexOf(notif.price) === -1)
                return;
            notificationShowing = true;
            image.setAttribute("style", `background-image: url("${notif.image}")`);
            title.innerText = replaceAll(replaceAll(replaceAll(params.title, "{user}", notif.user), "{reward}", notif.title), "{price}", notif.price);
            message.innerText = notif.text;
            container.setAttribute("class", "");
            if (params.audioUrl && (audioPrices.length === 0 || audioPrices.indexOf(notif.price) !== -1)) {
                try {
                    audio = new Audio();
                    audio.src = params.audioUrl;
                    audio.volume = params.audioVolume ? parseFloat(params.audioVolume) : 1;
                    audio.play();
                    await new Promise((res) => {
                        audio.onended = res;
                        audio.onerror = res;
                    })
                } catch (e) {
                    console.log("Audio playback error:", e)
                }
            }
            if (params.tts && (ttsPrices.length === 0 || ttsPrices.indexOf(notif.price) !== -1)) {
                try {
                    let tts = new Audio();
                    tts.src = `https://translate.google.com/translate_tts?ie=UTF-8&total=1&idx=0&client=tw-ob&q=${notif.text}&tl=ru`;
                    tts.volume = parseFloat(params.tts);
                    tts.play();
                    await new Promise((res) => {
                        tts.onended = res;
                        tts.onerror = res;
                    })
                } catch (e) {
                    console.log("TTS error:", e)
                }
            }
            await sleep(parseInt(params.showTime));
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
                                    let defimg = reward.image;

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
                                    notifications.push({
                                        image: imageUrl,
                                        title: reward.title,
                                        price: reward.cost,
                                        user: msg.data.redemption.user.display_name,
                                        text: msg.data.redemption.user_input,
                                    });
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
