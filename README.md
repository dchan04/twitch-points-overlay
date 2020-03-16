# twitch-points-overlay
Twitch channel points overlay for OBS

## Building 
- Install all modules with yarn
- Install browserify
- Run browserify index.js -o bundle.js

## Usage
Simply open file in browser or OBS browser source and add parameters:
- channelId - ID of channel which you want notifications about (example: 652542)
- showTime - for how long notification will be shown (example: 5000)
- title - title of notifications which can include variables:
  - {user} - who redeemed a reward
  - {price} - price of reward
  - {reward} - name of reward
- textStyle - css applied to message text
- textColor - message text color (example: #fff)
- textSize - message text size (example: 25px)
- titleStyle - css applied to notification title
- titleColor - notification title color (example: #fff)
- titleSize - notification title size (example: 25px)
- imageStyle - css applied to reward image
- imageHeight - height of image (example: 100px)
- audioUrl - url of audio to play (example: file:///home/marko/Desktop/coins.mp3)
- audioVolume - volume (from 0.0 to 1.0) of audio
- tts - tts volume (from 0.0 to 1.0), if not set tts is disabled
- ttsLang - text to speech language (example: en)
- showPrices - comma separated list of prices on which notification is shown (example: 5000, 10000)
- audioPrices - comma separated list of prices on which audio is played
- ttsPrices - comma separated list of prices on which tts is enabled
- botChannelName - channel name for chatbot to listen for "Highlight My Message" redemptions (example: 33kk)
- highlightTitle - custom title instead of "Highlight My Message"
- highlightPrice - custom highlight price instead of default 500
- defImg - image url to show on rewards without icon (example: https://img.host/cat.png)
- img - image url to show on all rewards (example: https://img.host/cat.gif)

Example: file:///path/to/index.html?channelId=562422&showTime=7500&imageStyle=height:250px&titleColor=red&title={user} spent {price} on {reward}
Or use github pages (tts wont work): https://33kk.github.io/twitch-points-overlay/?channelId=562422&showTime=7500&imageStyle=height:250px&titleColor=red&title={user} spent {price} on {reward}
