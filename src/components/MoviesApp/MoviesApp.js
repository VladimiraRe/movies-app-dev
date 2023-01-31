/* eslint-disable max-len */
import { Component } from 'react';
import { Layout, Alert, Input } from 'antd';
import lodashDebounce from 'lodash.debounce';

import TheMovieDB from '../../requests/TheMovieDB';
import MoviesList from '../MoviesList';
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
            this.settings.serverSize
        );
        this.settings.numberOfRequests = this.settings.numberOfMoviesInRequest / this.settings.serverSize;
        this.enterGuestSession();
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
        const { search, inputValue, isOnline, guestSessionId, type } = this.state;
        const { localStorage, ...settings } = this.settings;
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
                    />
                ) : (
                    <Alert message='Oops' description='No internet connection' type='error' />
                )}
            </Layout>
        );
    }
}

function Content({ search, value, inputFunc, type, guestSessionId, settings }) {
    return (
        <>
            <Input onChange={inputFunc} placeholder='Type to search...' value={value} />
            <MoviesList search={search} type={type} sessionId={guestSessionId} settings={settings} />
        </>
    );
}
