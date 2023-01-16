/* eslint-disable max-len */
import { Component } from 'react';
import { Layout } from 'antd';

import MoviesList from '../MoviesList';
import './MoviesApp.css';

export default class MoviesApp extends Component {
    state = {
        search: '',
    };

    render() {
        const { search } = this.state;

        return (
            <Layout className='moviesApp'>
                <MoviesList search={search} />;
            </Layout>
        );
    }
}
