export default class TheMovieDB {
    _baseApi = 'https://api.themoviedb.org/3';

    _apiKey = 'b9a650f12ff7d9fcf25e0ad6d4fc0d66';

    serverSize = 20;

    serverLimit = 500;

    async searchMovies(sessionId, request, page) {
        const method = '/search/movie';
        const res = await this._get(method, page, request);
        const transformRes = await this._transformData(res.results, sessionId);
        return { data: transformRes, totalPages: res.total_pages };
    }

    async getPopularMovies(sessionId, page) {
        const method = '/movie/popular';
        const res = await this._get(method, page);
        const transformRes = await this._transformData(res.results, sessionId);
        return { data: transformRes, totalPages: res.total_pages };
    }

    async getRatedMovies(sessionId) {
        const res = await this._getRatedMoviesAllFields(sessionId);
        const transformRes = await this._transformData(res);
        return { data: transformRes, totalPages: res.length / this.serverSize };
    }

    async rateMovie(sessionId, movieId, raiting) {
        const method = `/movie/${movieId}/rating`;
        const headers = { 'Content-Type': 'application/json;charset=utf-8' };
        const data = { value: raiting };
        const res = await this._post(method, data, sessionId, headers);
        return res;
    }

    async createGuestSession() {
        const method = '/authentication/guest_session/new';
        const res = await this._get(method);
        return res.guest_session_id;
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

    async _post(method, data, sessionId, headers) {
        let url = `${this._baseApi}${method}?api_key=${this._apiKey}`;
        if (sessionId) url += `&guest_session_id=${sessionId}`;
        const obj = { method: 'POST' };
        if (data) obj.body = JSON.stringify(data);
        if (headers) obj.headers = headers;
        const res = await fetch(url, obj);
        if (!res.ok) throw new Error(`Couldn't fetch ${url}, response status: ${res.status}`);
        return true;
    }

    async _transformData(data, sessionId) {
        const rating = null;

        const res = data.map((movie) => ({
            id: movie.id,
            title: movie.title,
            poster: movie.poster_path,
            date: movie.release_date,
            description: movie.overview,
            voteAverage: +movie.vote_average.toFixed(1),
            rating: !sessionId ? movie.rating : rating,
        }));

        if (sessionId) {
            const ownRating = await this._getRatedMoviesAllFields(sessionId);
            ownRating.forEach((movieWithRating) => {
                res.filter((movie) => {
                    if (movie.id === movieWithRating.id) {
                        // eslint-disable-next-line no-param-reassign
                        movie.rating = movieWithRating.rating;
                        return true;
                    }
                    return false;
                });
            });
        }

        return res;
    }

    async _getRatedMoviesAllFields(sessionId) {
        const method = `/guest_session/${sessionId}/rated/movies`;
        const res = await this._get(method);
        return res.results;
    }
}
