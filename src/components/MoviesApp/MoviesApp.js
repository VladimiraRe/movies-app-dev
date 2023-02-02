/* eslint-disable max-len */
import { Component } from 'react';
import { Layout, Alert, Input } from 'antd';
import lodashDebounce from 'lodash.debounce';

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
        serverSize: 20,
        serverLimit: 500,
        numberOfMoviesInRequest: null,
        numberOfRequests: null,
    };

    state = {
        inputValue: '',
        search: '',
        isOnline: navigator.onLine,
        type: 'popular',
    };

    componentDidMount() {
        this.settings.numberOfMoviesInRequest = MoviesApp.numberOfMoviesInRequest(
            this.settings.appSize,
            this.theMovieDB.serverSize
        );
        this.settings.numberOfRequests = this.settings.numberOfMoviesInRequest / this.theMovieDB.serverSize;
        this.enterGuestSession();
        // eslint-disable-next-line no-unused-vars
        this.theMovieDB
            .getGenres()
            .then((genres) => {
                this.setState({ genres });
            })
            .catch(() => {
                this.setState({ genres: [] });
            });
    }

    changeValue = (value, e) => {
        const newValue = e.target.value;
        this.setState(({ search }) => {
            if (!search === newValue) return false;
            return { [value]: newValue };
        });
    };

    changeSearch = (e) => {
        this.changeValue('inputValue', e);
        const debobounce = lodashDebounce(() => {
            this.changeValue('search', e);
            this.setState({ inputValue: '' });
        }, 2000);
        debobounce();
    };

    changeType = (type) => {
        this.setState({ type });
    };

    enterGuestSession = async () => {
        const { localStorage } = this.settings;
        let guestSessionId = localStorage.getItem('guestSessionId');
        if (!guestSessionId) {
            const value = await this.theMovieDB.createGuestSession();
            localStorage.setItem('guestSessionId', value);
            guestSessionId = localStorage.getItem('guestSessionId');
        }
        this.setState({ guestSessionId });
    };

    render() {
        const { search, inputValue, isOnline, guestSessionId, type, genres } = this.state;
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
                        inputFunc={this.changeSearch}
                        search={search}
                        value={inputValue}
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

function Content({ search, value, inputFunc, type, guestSessionId, settings, changeType, context }) {
    return (
        <>
            <Menu onClick={changeType} type={type} />
            {type !== 'rated' && <Input onChange={inputFunc} placeholder='Type to search...' value={value} />}
            <GenresContext.Provider value={context.genres}>
                <MovieDbContext.Provider value={context.theMovieDB}>
                    <MoviesList search={search} type={type} sessionId={guestSessionId} settings={settings} />
                </MovieDbContext.Provider>
            </GenresContext.Provider>
        </>
    );
}
