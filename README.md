# twitch-points-overlay
Twitch channel points overlay for OBS

## Usage
Simply open file in browser or OBS browser source and add parameters:
- channelId - ID of channel which you want notifications about
- showTime - for how long notification will be shown
- title - title of notifications which can include variables:
  - {user} - who redeemed a reward
  - {price} - price of reward
  - {reward} - name of reward
- textStyle - css applied to message text
- textColor - message text color
- textSize - message text size
- titleStyle - css applied to notification title
- titleColor - notification title color
- titleSize - notification title size
- imageStyle - css applied to reward image
- audioUrl - url of audio to play
- audioVolume - volume (from 0.0 to 1.0) of audio
- tts - tts volume (from 0.0 to 1.0), if not set tts is disabled
- showPrices - comma separated list of prices on which notification is shown
- audioPrices - comma separated list of prices on which audio is played
- ttsPrices - comma separated list of prices on which tts is enabled

Example: file:///path/to/index.html?channelId=562422&showTime=7500&imageStyle=height:250px&titleColor=red&title={user} spent {price} on {reward}
