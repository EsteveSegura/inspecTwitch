const axios = require('axios');
const path = require('path')

async function getApiData(userTwitch) {
    let getData = await axios.get(`https://tmi.twitch.tv/group/user/${userTwitch}/chatters`);
    return getData
}

async function streamerIsOnline(userTwitch) {
    let config = require(path.join(__dirname, '../config.json'))
    try {
        let getBearer =  await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${config.CLIENT_ID}&client_secret=${config.CLIENT_SECRET}&grant_type=client_credentials`)
        let headers = {
            'headers': {
                'Authorization': `Bearer ${getBearer.data.access_token}`,
                'Client-ID': config.CLIENT_ID,
                'Accept': 'application/vnd.twitchtv.v5+json'
            }
        }
        let getId = await axios.get(`https://api.twitch.tv/kraken/users/?login=${userTwitch}`, headers)
        let getViews = await axios.get(`https://api.twitch.tv/helix/streams?user_id=${getId.data.users[0]._id}`, headers)

        if (getViews.data.data.length == 0) {
            return false
        } else {
            return true
        }
    } catch (error) {
        console.log(error)
    }
}


module.exports = { getApiData, streamerIsOnline }