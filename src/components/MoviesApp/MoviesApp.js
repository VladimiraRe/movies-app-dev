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
        search: '',
        input: '',
        isOnline: navigator.onLine,
    };

    async componentDidMount() {
        this.settings.numberOfMoviesInRequest = MoviesApp.numberOfMoviesInRequest(
            this.settings.appSize,
            this.theMovieDB.serverSize
        );
        this.settings.numberOfRequests = this.settings.numberOfMoviesInRequest / this.theMovieDB.serverSize;
        this.debounceSearch = debounce((input) => this.startSearch(input), 2000);

        const newState = { type: 'popular' };
        newState.guestSessionId = await this.enterGuestSession();
        newState.genres = await this.theMovieDB.getGenres().catch(() => []);
        newState.baseImgUrl = await this.theMovieDB.getBaseImgUrl().catch(() => false);
        newState.ratedMovies = await this.theMovieDB.getRatedMovies(newState.guestSessionId).catch(() => []);
        this.setState(newState);
    }

    componentDidUpdate(prevProps, prevState) {
        const { input, type } = this.state;
        if (prevState.input !== input && prevState.type === type) {
            this.debounceSearch(input);
        }
    }

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

    changeRatedMovies = async (data, isNeedToDelete) => {
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
                .catch(() => '');
        }
        return guestSessionId;
    };

    render() {
        const { search, isOnline, guestSessionId, type, genres, input, baseImgUrl, ratedMovies } = this.state;
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
                        changeInput={this.changeInput}
                        input={input}
                        search={search}
                        guestSessionId={guestSessionId}
                        type={type}
                        settings={settings}
                        changeType={this.changeType}
                        context={{ genres, theMovieDB: this.theMovieDB }}
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
    search,
    input,
    type,
    guestSessionId,
    settings,
    changeType,
    context,
    changeInput,
}) {
    return (
        <>
            <Menu onClick={changeType} type={type} />
            {type !== 'rated' && (
                <Input onChange={(e) => changeInput(e.target.value)} value={input} placeholder='Type to search...' />
            )}
            <GenresContext.Provider value={context.genres}>
                <MovieDbContext.Provider value={context.theMovieDB}>
                    <MoviesList
                        baseImgUrl={baseImgUrl}
                        ratedMovies={ratedMovies}
                        changeRatedMovies={changeRatedMovies}
                        search={search}
                        type={type}
                        sessionId={guestSessionId}
                        settings={settings}
                    />
                </MovieDbContext.Provider>
            </GenresContext.Provider>
        </>
    );
}
