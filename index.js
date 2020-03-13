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

    let ws = undefined;
    let pong = false;
    let interval = false;

    let notifications = [];

    let notificationShowing = false;
    setInterval(async () => {
        if (!notificationShowing && notifications.length > 0) {
            let notif = notifications.pop();
            notificationShowing = true;
            image.setAttribute("style", `background-image: url("${notif.image}")`);
            title.innerText = replaceAll(replaceAll(replaceAll(params.title, "{user}", notif.user), "{reward}", notif.title), "{price}", notif.price);
            message.innerText = notif.text;
            container.setAttribute("class", "");
            await sleep(parseInt(params.showTime));
            container.setAttribute("class", "hide");
        }
    }, 5000);

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
