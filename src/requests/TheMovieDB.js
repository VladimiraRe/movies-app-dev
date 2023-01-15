export default class TheMovieDB {
    _baseApi = 'https://api.themoviedb.org/';

    _apiKey = 'b9a650f12ff7d9fcf25e0ad6d4fc0d66';

    static async get(url) {
        let res = await fetch(url).catch((err) => {
            throw err;
        });
        if (!res.ok) throw new Error(`Couldn't fetch ${url}, response status: ${res.status}`);
        res = await res.json();
        return res;
    }

    async getListOfMovies(request) {
        const url = `${this._baseApi}3/search/movie?api_key=${this._apiKey}&query=${request}`;
        const res = await TheMovieDB.get(url);
        return res;
    }

    async getConfiguration() {
        const url = `${this._baseApi}3/configuration?api_key=${this._apiKey}`;
        const res = await TheMovieDB.get(url);
        return res;
    }

    async getBaseImgUrl() {
        const {
            images: {
                base_url: baseUrl,
                poster_sizes: [, , w185],
            },
        } = await this.getConfiguration();
        return baseUrl + w185;
    }
}
