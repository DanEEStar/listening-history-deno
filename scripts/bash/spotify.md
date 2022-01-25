# Spotify Command Line Examples

## generate new access token with refresh token

export SPOTIFY_ACCESS_TOKEN=$(eval "curl -H 'Authorization: Basic $(echo -n "${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}" | base64)' -d grant_type=refresh_token -d refresh_token=${SPOTIFY_REFRESH_TOKEN} https://accounts.spotify.com/api/token" | jq '.access_token' | sed -e 's/^"//' -e 's/"$//')

## get recently played

curl -X GET "https://api.spotify.com/v1/me/player/recently-played?limit=50" -H "Authorization: Bearer $SPOTIFY_ACCESS_TOKEN" 

curl -X GET "https://api.spotify.com/v1/me/player/recently-played?limit=50" -H "Authorization: Bearer $SPOTIFY_ACCESS_TOKEN" > "recent_$(date +%F).json"

## get currently playing

curl -X GET "https://api.spotify.com/v1/me/player/currently-playing" -H "Authorization: Bearer $SPOTIFY_ACCESS_TOKEN"


## user devices

curl -X GET "https://api.spotify.com/v1/me/player/devices" -H "Authorization: Bearer $SPOTIFY_ACCESS_TOKEN"


## pause/play playing

curl -X PUT "https://api.spotify.com/v1/me/player/pause" -H "Authorization: Bearer $SPOTIFY_ACCESS_TOKEN"

curl -X PUT "https://api.spotify.com/v1/me/player/play?device_id=$SPOTIFY_DEVICE_ID" -H "Authorization: Bearer $SPOTIFY_ACCESS_TOKEN"


## continue playing from concrete album/track
curl -X PUT "https://api.spotify.com/v1/me/player/play?device_id=$SPOTIFY_DEVICE_ID" --data '{"context_uri": "spotify:album:0Cat4w4xf3pbZyRY3qOwWG", "offset": {"position": 3}}' -H "Authorization: Bearer $SPOTIFY_ACCESS_TOKEN"
