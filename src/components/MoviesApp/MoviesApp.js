/* eslint-disable max-len */
import { Component } from 'react';
import { Layout, Alert, Input } from 'antd';
import lodashDebounce from 'lodash.debounce';

import TheMovieDB from '../../requests/TheMovieDB';
import MoviesList from '../MoviesList';
import './MoviesApp.css';

export default class MoviesApp extends Component {
    theMovieDB = new TheMovieDB();

    localStorage = window.localStorage;

    state = {
        inputValue: '',
        search: '',
        isOnline: navigator.onLine,
        type: 'popular',
    };

    componentDidMount() {
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
        let guestSessionId = this.localStorage.getItem('guestSessionId');
        if (!guestSessionId) {
            const value = await this.theMovieDB.createGuestSession();
            this.localStorage.setItem('guestSessionId', value);
            guestSessionId = this.localStorage.getItem('guestSessionId');
        }
        this.setState({ guestSessionId });
    };

    render() {
        const { search, inputValue, isOnline, guestSessionId, type } = this.state;
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
                    />
                ) : (
                    <Alert message='Oops' description='No internet connection' type='error' />
                )}
            </Layout>
        );
    }
}

function Content({ search, value, inputFunc, type, guestSessionId }) {
    return (
        <>
            <Input onChange={inputFunc} placeholder='Type to search...' value={value} />
            <MoviesList search={search} type={type} sessionId={guestSessionId} />
        </>
    );
}
