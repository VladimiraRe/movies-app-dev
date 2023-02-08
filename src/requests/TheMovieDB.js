export default class TheMovieDB {
    _baseApi = 'https://api.themoviedb.org/3';

    _apiKey = 'b9a650f12ff7d9fcf25e0ad6d4fc0d66';

    serverSize = 20;

    serverLimit = 500;

    async searchMovies(request, page, ratedMovies) {
        const method = '/search/movie';
        const res = await this._get(method, page, request);
        const transformRes = TheMovieDB._transformData(res.results, ratedMovies);
        return { data: transformRes, totalPages: res.total_pages, totalResults: res.total_results };
    }

    async getPopularMovies(page, ratedMovies) {
        const method = '/movie/popular';
        const res = await this._get(method, page);
        const transformRes = TheMovieDB._transformData(res.results, ratedMovies);
        return { data: transformRes, totalPages: res.total_pages, totalResults: res.total_results };
    }

    async getRatedMovies(sessionId, errorHandle, page) {
        const method = `/guest_session/${sessionId}/rated/movies`;
        const getData = async (pageNumber, fn, definite) => {
            const res = await this._get(method, pageNumber).catch((err) => {
                throw err;
            });
            const transformRes = TheMovieDB._transformData(res.results);
            let data = transformRes;
            if (pageNumber === 1 || definite) {
                data = { data };
                data.totalPages = res.total_pages;
            }
            return fn ? fn(data) : data;
        };

        if (page) {
            const ratedMovies = await getData(page, false, true);
            return ratedMovies.data;
        }

        const ratedMovies = await getData(1).catch(() => {
            errorHandle();
            return false;
        });
        if (!ratedMovies) return [];
        if (ratedMovies.totalPages === 1) return ratedMovies.data;
        const arr = [];
        for (let i = 2; i <= ratedMovies.totalPages; i++) {
            arr.push(
                new Promise((resolve) => {
                    getData(i, resolve);
                })
                    .then((r) => {
                        ratedMovies.data = [...ratedMovies.data, ...r];
                    })
                    .catch(() => errorHandle())
            );
        }

        await Promise.all(arr);
        return ratedMovies.data;
    }

    async rateMovie(sessionId, movieId, raiting, isNeedToDlete) {
        const method = `/movie/${movieId}/rating`;
        const headers = { 'Content-Type': 'application/json;charset=utf-8' };
        const data = { value: raiting };
        const res = !isNeedToDlete
            ? await this._post(method, data, sessionId, headers)
            : await this._delete(method, sessionId, headers);
        return res;
    }

    async createGuestSession() {
        const method = '/authentication/guest_session/new';
        const res = await this._get(method);
        return res.guest_session_id;
    }

    async getGenres() {
        const method = '/genre/movie/list';
        const res = this._get(method);
        return res;
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
        if (request) url += `&query=${request}`;
        if (page) url += `&page=${page}`;

        let res = await fetch(url);
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

    async _delete(method, sessionId, headers) {
        let url = `${this._baseApi}${method}?api_key=${this._apiKey}`;
        if (sessionId) url += `&guest_session_id=${sessionId}`;
        const obj = { method: 'DELETE' };
        if (headers) obj.headers = headers;
        const res = await fetch(url, obj);
        if (!res.ok) throw new Error(`Couldn't fetch ${url}, response status: ${res.status}`);
        return true;
    }

    static _transformData(data, ratedMovies) {
        const movies = data.map((movie) => {
            const newMovieData = {
                id: movie.id,
                title: movie.title,
                poster: movie.poster_path,
                date: movie.release_date,
                description: movie.overview,
                voteAverage: +movie.vote_average.toFixed(1),
                genreIds: movie.genre_ids,
            };
            if (ratedMovies) {
                const findObj = ratedMovies.find((el) => el.id === movie.id);
                newMovieData.rating = findObj ? findObj.rating : null;
            }
            if (!ratedMovies) {
                newMovieData.rating = movie.rating || null;
            }
            return newMovieData;
        });
        return movies;
    }
}
