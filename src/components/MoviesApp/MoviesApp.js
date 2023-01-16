/* eslint-disable max-len */
import { Component } from 'react';
import { Layout, Alert } from 'antd';

import MoviesList from '../MoviesList';
import './MoviesApp.css';

export default class MoviesApp extends Component {
    state = {
        search: '',
        isOnline: navigator.onLine,
    };

    render() {
        const { search, isOnline } = this.state;
        if (isOnline) {
            window.addEventListener('offline', () => this.setState({ isOnline: false }));
        } else {
            window.addEventListener('online', () => this.setState({ isOnline: true }));
        }

        return (
            <Layout className='moviesApp'>
                {isOnline ? (
                    <MoviesList search={search} />
                ) : (
                    <Alert message='Oops' description='No internet connection' type='error' />
                )}
            </Layout>
        );
    }
}
