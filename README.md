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
  
Example: file:///path/to/index.html?channelId=562422&showTime=7500&title={user} spent {price} on {reward}
