export default class TheMovieDB {
    _baseApi = 'https://api.themoviedb.org/3';

    _apiKey = 'b9a650f12ff7d9fcf25e0ad6d4fc0d66';

    async searchMovies(request, page) {
        const method = '/search/movie';
        const res = await this._get(method, page, request);
        return TheMovieDB._transformData(res);
    }

    async getPopularMovies(page) {
        const method = '/movie/popular';
        const res = await this._get(method, page);
        return TheMovieDB._transformData(res);
    }

    async getConfiguration() {
        const res = await this._get('/configuration');
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

    async _get(method, page, request) {
        let url = `${this._baseApi}${method}?api_key=${this._apiKey}`;
        if (page) url += `&page=${page}`;
        if (request) url += `&query=${request}`;

        let res = await fetch(url).catch((err) => {
            throw err;
        });
        if (!res.ok) throw new Error(`Couldn't fetch ${url}, response status: ${res.status}`);
        res = await res.json();

        return res;
    }

    static _transformData(data) {
        let res = data.results;
        res = res.map((el) => ({
            title: el.title,
            poster: el.poster_path,
            date: el.release_date,
            description: el.overview,
        }));
        return res;
    }
}
