import axios from '@nuxtjs/axios';

export const state = () => ({
    user:null,
    auth:false
})

export const mutations = {
    login(state,payload) {
        state.auth = true,
        state.user = payload
    },
    logout(state){
        state.auth = false
        state.user = null
    },

}

export const actions = {
    async callAPI({state},payload){
        let api =  this.$axios.create({
            baseURL : 'https://api.spotify.com/v1',
            headers:{'Authorization':`Bearer ${state.user.accessToken}`},
            responseType: 'json'
        });
        let method = payload.method ?? 'GET';
        return (await api[method.toLowerCase()](payload.url,payload.params)).data;
    }
}