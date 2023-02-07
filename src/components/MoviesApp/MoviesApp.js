/* eslint-disable max-len */
import { Component } from 'react';
import { Layout, Alert, Input } from 'antd';
import { debounce } from 'lodash';

import TheMovieDB from '../../requests/TheMovieDB';
import GenresContext from '../../contexts/GenresContext';
import MovieDbContext from '../../contexts/MovieDbContext';
import MoviesList from '../MoviesList';
import Menu from '../Menu';
import './MoviesApp.css';

export default class MoviesApp extends Component {
    static numberOfMoviesInRequest = (x, y) => {
        const gcd = (a, b) => (a % b === 0 ? b : gcd(b, a % b));
        const scm = (a, b) => (a * b) / gcd(a, b);
        return scm(x, y);
    };

    theMovieDB = new TheMovieDB();

    settings = {
        localStorage: window.localStorage,
        appSize: 6,
        numberOfMoviesInRequest: null,
        numberOfRequests: null,
    };

    state = {
        type: null,
        search: '',
        input: '',
        isOnline: navigator.onLine,
        guestSessionId: null,
        baseImgUrl: null,
        genres: [],
        ratedMovies: [],
        error: { app: 0, moviesList: 0 },
    };

    async componentDidMount() {
        this.settings.numberOfMoviesInRequest = MoviesApp.numberOfMoviesInRequest(
            this.settings.appSize,
            this.theMovieDB.serverSize
        );
        this.settings.numberOfRequests = this.settings.numberOfMoviesInRequest / this.theMovieDB.serverSize;
        this.debounceSearch = debounce((input) => this.startSearch(input), 2000);

        const newState = { type: 'popular' };
        let error = 0;
        newState.guestSessionId = await this.enterGuestSession().catch(() => {
            error += 1;
            return null;
        });
        newState.genres = await this.theMovieDB.getGenres().catch(() => {
            error += 1;
            return [];
        });
        newState.baseImgUrl = await this.theMovieDB.getBaseImgUrl().catch(() => {
            error += 1;
            return null;
        });
        newState.ratedMovies = await this.theMovieDB.getRatedMovies(newState.guestSessionId).catch(() => {
            error += 1;
            return [];
        });
        if (error > 0) {
            const { error: stateError } = this.state;
            newState.error = { ...stateError, app: error };
        }
        this.setState(newState);
    }

    componentDidUpdate(prevProps, prevState) {
        const { input, type } = this.state;
        if (prevState.input !== input && prevState.type === type) {
            this.debounceSearch(input);
        }
    }

    changeError = (value, name) => {
        this.setState(({ error }) => {
            return { error: { ...error, [name]: error[name] + value } };
        });
    };

    changeInput = (input) => {
        this.setState({ input });
    };

    startSearch = (value) => {
        const newValue = value.trim();
        this.setState(({ search, type }) => {
            if ((search === newValue && newValue !== '') || (newValue === '' && type === 'popular')) return false;
            if (newValue === '' && type !== 'popular') return { type: 'popular' };
            return type !== 'search' ? { search: newValue, type: 'search' } : { search: newValue };
        });
    };

    changeType = (newType) => {
        this.setState(({ type, search, input }) => {
            if (type === newType) return false;
            const newState = { type: newType };
            if (search !== '' && newType === 'popular') newState.search = '';
            if (input !== '' && newType === 'popular') newState.input = '';
            return newState;
        });
    };

    changeRatedMovies = (data, isNeedToDelete) => {
        if (isNeedToDelete) {
            this.setState(({ ratedMovies }) => ({ ratedMovies: ratedMovies.filter((el) => el.id !== data) }));
            return;
        }
        this.setState(({ ratedMovies }) => {
            let isNewMovie = true;
            const newData = ratedMovies.map((el) => {
                if (el.id !== data.id) return el;
                isNewMovie = false;
                return { ...el, rating: data.rating };
            });
            if (!isNewMovie) return { ratedMovies: newData };
            return { ratedMovies: [...ratedMovies, data] };
        });
    };

    getRatedMovies = async () => {
        const { guestSessionId, type } = this.state;
        try {
            const res = await this.theMovieDB.getRatedMovies(guestSessionId);
            this.setState({ ratedMovies: res });
            return res;
        } catch {
            if (type === 'rated') {
                this.setState({ ratedMovies: [] });
                return false;
            }
            this.setState(({ error }) => ({ ratedMovies: [], error: { ...error, app: error.app + 1 } }));
            return false;
        }
    };

    enterGuestSession = async () => {
        const { localStorage } = this.settings;
        let guestSessionId = localStorage.getItem('guestSessionId');
        if (!guestSessionId) {
            guestSessionId = await this.theMovieDB
                .createGuestSession()
                .then((value) => {
                    localStorage.setItem('guestSessionId', value);
                    return localStorage.getItem('guestSessionId');
                })
                .catch((err) => {
                    throw err;
                });
        }
        return guestSessionId;
    };

    render() {
        const { search, isOnline, guestSessionId, type, genres, input, baseImgUrl, ratedMovies, error } = this.state;
        const { localStorage, ...appSettings } = this.settings;
        const { serverSize, serverLimit } = this.theMovieDB;
        const settings = { ...appSettings, serverSize, serverLimit };

        if (isOnline) {
            window.addEventListener('offline', () => this.setState({ isOnline: false }));
        } else {
            window.addEventListener('online', () => this.setState({ isOnline: true }));
        }

        return (
            <Layout className='moviesApp'>
                {isOnline ? (
                    <Content
                        baseImgUrl={baseImgUrl}
                        ratedMovies={ratedMovies}
                        changeRatedMovies={this.changeRatedMovies}
                        getRatedMovies={this.getRatedMovies}
                        changeType={this.changeType}
                        input={input}
                        search={search}
                        guestSessionId={guestSessionId}
                        type={type}
                        settings={settings}
                        changeInput={this.changeInput}
                        changeError={this.changeError}
                        context={{ genres, theMovieDB: this.theMovieDB }}
                        error={error}
                    />
                ) : (
                    <Alert message='Oops' description='No internet connection' type='error' />
                )}
            </Layout>
        );
    }
}

function Content({
    baseImgUrl,
    ratedMovies,
    changeRatedMovies,
    getRatedMovies,
    search,
    input,
    type,
    guestSessionId,
    settings,
    changeInput,
    changeError,
    context,
    changeType,
    error,
}) {
    const allError = Object.values(error).reduce((acc, el) => {
        return acc + el;
    }, 0);
    return (
        <>
            {allError > 0 && allError <= 2 && (
                <Alert
                    className='moviesApp__error-banner'
                    message="The app doesn't work correctly, we recommend to restart it"
                    banner
                    closable
                />
            )}
            {allError > 2 && (
                <Alert
                    className='moviesApp__error-banner'
                    type='error'
                    message='Critical bugs have been found, restart the app'
                    banner
                />
            )}
            <Menu className='moviesApp__menu' onClick={changeType} type={type} />
            {type !== 'rated' && (
                <Input onChange={(e) => changeInput(e.target.value)} value={input} placeholder='Type to search...' />
            )}
            <GenresContext.Provider value={context.genres}>
                <MovieDbContext.Provider value={context.theMovieDB}>
                    <MoviesList
                        baseImgUrl={baseImgUrl}
                        ratedMovies={ratedMovies}
                        changeRatedMovies={changeRatedMovies}
                        getRatedMovies={getRatedMovies}
                        search={search}
                        type={type}
                        sessionId={guestSessionId}
                        settings={settings}
                        changeError={changeError}
                    />
                </MovieDbContext.Provider>
            </GenresContext.Provider>
        </>
    );
}
